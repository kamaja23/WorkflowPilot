import { repositories } from '../db';
import { mockLlm } from '../providers/mockLlm';
import { mockIssueTracker } from '../integrations/mockIssue';
import { validationEngine } from '../validation/engine';
import { canTransitionStep, canTransitionRun } from '../state';

export async function runWorkflow(workflowId: string, input: any) {
  const workflow = await repositories.getWorkflowById(workflowId);
  if (!workflow) throw new Error('Workflow not found');
  const def = typeof workflow.definition === 'string' ? JSON.parse(workflow.definition) : workflow.definition;
  const steps = def.steps || [];
  
  const run = await repositories.createRun(workflowId, workflow.version || 1, input);
  const runId = run.id;
  
  const stepRecords: any[] = [];
  for (const stepDef of steps) {
    const step = await repositories.createStep(runId, { key: stepDef.key, name: stepDef.name, position: stepDef.position, attempt: 1 });
    stepRecords.push({ def: stepDef, record: step });
  }
  
  // Execute steps
  let runStatus = 'running';
  let overallFailed = false;
  let needsReview = false;
  
  for (let i = 0; i < stepRecords.length; i++) {
    const { def: stepDef, record: stepRecord } = stepRecords[i];
    const stepId = stepRecord.id;
    
    // Mark running
    await repositories.updateStep(stepId, { status: 'running', started_at: new Date() });
    await repositories.createStepAttempt(stepId, 1, { status: 'running' });
    
    try {
      if (stepDef.type === 'llm') {
        if (stepDef.key === 'classify') {
          const result = await mockLlm.generateStructuredOutput({ classify: true, ...input }, { category: 'string', urgency: 'string', rationale: 'string' });
          await repositories.updateStep(stepId, { status: 'succeeded', output: result.output, finished_at: new Date() });
          await repositories.updateStepAttempt((await repositories.getStepAttempts(stepId))[0]?.id, { status: 'succeeded', output: result.output, finished_at: new Date() });
        } else if (stepDef.key === 'draft_response') {
          const result = await mockLlm.generateStructuredOutput({ draft_response: true, ...input }, { body: 'string', send: 'boolean' });
          await repositories.updateStep(stepId, { status: 'succeeded', output: result.output, finished_at: new Date() });
          const attempts = await repositories.getStepAttempts(stepId);
          if (attempts[0]) await repositories.updateStepAttempt(attempts[0].id, { status: 'succeeded', output: result.output, finished_at: new Date() });
        } else {
          const result = await mockLlm.generateStructuredOutput({ step: stepDef.key, ...input }, {});
          await repositories.updateStep(stepId, { status: 'succeeded', output: result.output, finished_at: new Date() });
          const attempts = await repositories.getStepAttempts(stepId);
          if (attempts[0]) await repositories.updateStepAttempt(attempts[0].id, { status: 'succeeded', output: result.output, finished_at: new Date() });
        }
      } else if (stepDef.type === 'validator') {
        const draftStep = stepRecords.find(s => s.def.key === 'draft_response');
        const draftOutput = draftStep ? (await repositories.getStepsForRun(runId)).find(st => st.step_key === 'draft_response')?.output : null;
        const validation = validationEngine.run(draftOutput, input);
        if (validation.passed) {
          await repositories.updateStep(stepId, { status: 'succeeded', output: validation, validation, finished_at: new Date() });
        } else {
          await repositories.updateStep(stepId, { status: 'failed', output: validation, validation, error_code: 'VALIDATION_FAILED', error_message: validation.issues.join(', '), finished_at: new Date() });
          overallFailed = true;
        }
        const attempts = await repositories.getStepAttempts(stepId);
        if (attempts[0]) await repositories.updateStepAttempt(attempts[0].id, { status: validation.passed ? 'succeeded' : 'failed', output: validation, validation, finished_at: new Date() });
      } else if (stepDef.type === 'route') {
        const validateStep = stepRecords.find(s => s.def.key === 'validate');
        const validateRow = (await repositories.getStepsForRun(runId)).find(st => st.step_key === 'validate');
        if (validateRow?.status === 'failed' || overallFailed) {
          await repositories.updateStep(stepId, { status: 'needs_review', output: { routed_to_review: true }, finished_at: new Date() });
          needsReview = true;
        } else {
          await repositories.updateStep(stepId, { status: 'succeeded', output: { routed: 'auto' }, finished_at: new Date() });
        }
        const attempts = await repositories.getStepAttempts(stepId);
        if (attempts[0]) await repositories.updateStepAttempt(attempts[0].id, { status: needsReview ? 'needs_review' : 'succeeded', finished_at: new Date() });
      } else if (stepDef.type === 'integration') {
        if (stepDef.config?.provider === 'jira' && (overallFailed || needsReview)) {
          const idempotencyKey = `${runId}:jira_escalation`;
          const issue = await mockIssueTracker.createIssue({ title: `WorkflowPilot escalation: ${runId}`, description: `Run failed/needs review. Input: ${JSON.stringify(input)}`, labels: ['workflowpilot', 'escalation'], idempotencyKey });
          await repositories.createIntegrationEvent({ run_id: runId, step_id: stepId, provider: 'jira-mock', event_type: 'create_issue', status: 'simulated', external_id: issue.externalId, details: { url: issue.url, idempotencyKey } });
          await repositories.updateStep(stepId, { status: 'succeeded', output: { escalated: true, externalId: issue.externalId, url: issue.url, mocked: true }, finished_at: new Date() });
        } else {
          await repositories.updateStep(stepId, { status: 'skipped', output: { skipped: true, reason: 'condition_not_met' }, finished_at: new Date() });
        }
        const attempts = await repositories.getStepAttempts(stepId);
        if (attempts[0]) await repositories.updateStepAttempt(attempts[0].id, { status: 'succeeded', finished_at: new Date() });
      } else if (stepDef.type === 'complete') {
        if (overallFailed || needsReview) {
          await repositories.finalizeRun(runId, 'failed', needsReview ? 'Routed for review / validation failed' : 'Validation failed');
          await repositories.updateStep(stepId, { status: 'succeeded', output: { run_finalized: 'failed' }, finished_at: new Date() });
        } else {
          await repositories.finalizeRun(runId, 'succeeded');
          await repositories.updateStep(stepId, { status: 'succeeded', output: { run_finalized: 'succeeded' }, finished_at: new Date() });
        }
        const attempts = await repositories.getStepAttempts(stepId);
        if (attempts[0]) await repositories.updateStepAttempt(attempts[0].id, { status: 'succeeded', finished_at: new Date() });
        break;
      }
    } catch (e: any) {
      await repositories.updateStep(stepId, { status: 'failed', error_code: 'RUNNER_ERROR', error_message: e.message, finished_at: new Date() });
      const attempts = await repositories.getStepAttempts(stepId);
      if (attempts[0]) await repositories.updateStepAttempt(attempts[0].id, { status: 'failed', error_message: e.message, finished_at: new Date() });
      overallFailed = true;
    }
  }
  
  if (overallFailed || needsReview) {
    const r = await repositories.getRun(runId);
    if (r?.status !== 'failed') await repositories.finalizeRun(runId, 'failed', needsReview ? 'Needs review' : 'Failed');
  } else {
    const r = await repositories.getRun(runId);
    if (r?.status !== 'succeeded') await repositories.finalizeRun(runId, 'succeeded');
  }
  
  return repositories.getRun(runId);
}
export default runWorkflow;
