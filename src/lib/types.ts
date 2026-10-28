export type RunStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';
export type StepStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'needs_review' | 'skipped' | 'cancelled';

export interface WorkflowStepDef {
  key: string;
  name: string;
  type: 'llm' | 'validator' | 'route' | 'integration' | 'complete';
  required: boolean;
  position: number;
  config?: Record<string, any>;
}

export interface WorkflowDef {
  name: string;
  version: number;
  steps: WorkflowStepDef[];
}

export interface LlmResult<T = any> {
  output: T;
  provider: string;
  model: string;
  latencyMs: number;
}

export interface LlmProvider {
  generateStructuredOutput<T>(input: unknown, schema: unknown): Promise<LlmResult<T>>;
}

export interface IssueResult {
  externalId: string;
  url?: string;
}

export interface IssueTracker {
  createIssue(input: { title: string; description: string; labels?: string[]; idempotencyKey: string }): Promise<IssueResult>;
}

export interface ReviewDecision {
  decision: 'approve' | 'reject';
  note?: string;
}
