import { RunStatus, StepStatus } from './types';

const allowedRun: Record<RunStatus, RunStatus[]> = {
  queued: ['running', 'cancelled'],
  running: ['succeeded', 'failed', 'cancelled'],
  succeeded: [],
  failed: [],
  cancelled: [],
};

const allowedStep: Record<StepStatus, StepStatus[]> = {
  queued: ['running', 'skipped', 'cancelled'],
  running: ['succeeded', 'failed', 'needs_review', 'cancelled'],
  succeeded: [],
  failed: ['running'], // retry
  needs_review: ['succeeded', 'failed', 'cancelled'], // after review approve/reject
  skipped: [],
  cancelled: [],
};

export function canTransitionRun(from: RunStatus, to: RunStatus): boolean {
  return allowedRun[from]?.includes(to) ?? false;
}

export function canTransitionStep(from: StepStatus, to: StepStatus): boolean {
  return allowedStep[from]?.includes(to) ?? false;
}

export function canRetryStep(status: StepStatus): boolean {
  return status === 'failed';
}

export function canReviewStep(status: StepStatus): boolean {
  return status === 'needs_review';
}

export function computeRunStatus(stepStatuses: Array<{ required: boolean; status: StepStatus }>): RunStatus {
  // If any required step failed and not resolved - but we pass current statuses; run becomes failed if required failed
  for (const s of stepStatuses) {
    if (s.required && s.status === 'failed') return 'failed';
    if (s.required && s.status === 'needs_review') return 'failed'; // will be needs_review state at run level not separate, but per spec failed/needs_review
  }
  // All required must be succeeded
  const required = stepStatuses.filter(s => s.required);
  if (required.length > 0 && required.every(s => s.status === 'succeeded')) return 'succeeded';
  // If any required still running/queued - keep running
  if (stepStatuses.some(s => s.status === 'running' || s.status === 'queued')) return 'running';
  // Default
  return 'failed';
}
