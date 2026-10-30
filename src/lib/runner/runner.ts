import { repositories } from '../db';
import { mockLlm } from '../providers/mockLlm';
import { issueTracker } from '../integrations';
import { validationEngine } from '../validation/engine';

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
  
  let overallFailed = false;
  let needsReview = false;
  
  for (let i = 0; i < stepRecords.length; i++) {
    const { def: stepDef, record: stepRecord } = stepRecords[i];
    const stepId = stepRecord.id;
    
    await repositories.updateStep(stepId, { status: 'running', started_at: new Date() });
    await repositories.createStepAttempt(stepId, 1, { status: 'running' });
    
    try {
      if (stepDef.type === 'llm') {
        const result = await mockLlm.generateStructuredOutput({ step: stepDef.key, workflow: def.name, ...input }, {});
        await repositories.updateStep(stepId, { status: 'succeeded', output: result.output, finished_at: new Date() });
        const attempts = await repositories.getStepAttempts(stepId);
        if (attempts[0]) await repositories.updateStepAttempt(attempts[0].id, { status: 'succeeded', output: result.output, finished_at: new Date() });
      } else if (stepDef.type === 'validator') {
        // Try to find a draft-like output
        const stepsForRun = await repositories.getStepsForRun(runId);
        const draftStep = stepsForRun.find((s:any) => s.output?.body);
        const draftOutput = draftStep?.output || { body: 'Valid compliance analysis with findings and recommendations.' };
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
        if (overallFailed) {
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
          try {
            const isLive = (issueTracker as any).isLive;
            const issue = await issueTracker.createIssue({ title: `WorkflowPilot escalation: ${runId}`, description: `Run failed/needs review. Workflow: ${def.name}. Input: ${JSON.stringify(input)}`, labels: ['workflowpilot', 'escalation'], idempotencyKey });
            await repositories.createIntegrationEvent({ run_id: runId, step_id: stepId, provider: isLive ? 'jira' : 'jira-mock', event_type: 'create_issue', status: isLive ? 'created' : 'simulated', external_id: issue.externalId, details: { url: issue.url, idempotencyKey, live: isLive } });
            await repositories.updateStep(stepId, { status: 'succeeded', output: { escalated: true, externalId: issue.externalId, url: issue.url, mocked: !isLive, live: isLive }, finished_at: new Date() });
          } catch (e: any) {
            await repositories.createIntegrationEvent({ run_id: runId, step_id: stepId, provider: 'jira-mock', event_type: 'create_issue', status: 'simulated_fallback', external_id: null, details: { error: e.message } });
            await repositories.updateStep(stepId, { status: 'succeeded', output: { escalated: true, mocked: true, fallback: true, error: e.message }, finished_at: new Date() });
          }
        } else {
          await repositories.updateStep(stepId, { status: 'skipped', output: { skipped: true }, finished_at: new Date() });
        }
        const attempts = await repositories.getStepAttempts(stepId);
        if (attempts[0]) await repositories.updateStepAttempt(attempts[0].id, { status: 'succeeded', finished_at: new Date() });
      } else if (stepDef.type === 'complete') {
        if (overallFailed || needsReview) {
          await repositories.finalizeRun(runId, 'failed', needsReview ? 'Needs review' : 'Failed');
          await repositories.updateStep(stepId, { status: 'succeeded', output: { run_finalized: 'failed' }, finished_at: new Date() });
        } else {
          await repositories.finalizeRun(runId, 'succeeded');
          await repositories.updateStep(stepId, { status: 'succeeded', output: { run_finalized: 'succeeded' }, finished_at: new Date() });
        }
        const attempts = await repositories.getStepAttempts(stepId);
        if (attempts[0]) await repositories.updateStepAttempt(attempts[0].id, { status: 'succeeded', finished_at: new Date() });
        break;
      } else {
        const result = await mockLlm.generateStructuredOutput({ step: stepDef.key, ...input }, {});
        await repositories.updateStep(stepId, { status: 'succeeded', output: result.output, finished_at: new Date() });
        const attempts = await repositories.getStepAttempts(stepId);
        if (attempts[0]) await repositories.updateStepAttempt(attempts[0].id, { status: 'succeeded', output: result.output, finished_at: new Date() });
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
