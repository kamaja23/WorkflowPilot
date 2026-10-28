import { describe, it, expect } from 'vitest';
import { canTransitionRun, canTransitionStep, canRetryStep, canReviewStep, computeRunStatus } from '@/lib/state';

describe('State machine', () => {
  it('run transitions', () => {
    expect(canTransitionRun('queued', 'running')).toBe(true);
    expect(canTransitionRun('running', 'succeeded')).toBe(true);
    expect(canTransitionRun('succeeded', 'failed')).toBe(false);
  });
  it('step transitions', () => {
    expect(canTransitionStep('queued', 'running')).toBe(true);
    expect(canTransitionStep('running', 'needs_review')).toBe(true);
    expect(canTransitionStep('failed', 'running')).toBe(true);
  });
  it('retry/review guards', () => {
    expect(canRetryStep('failed')).toBe(true);
    expect(canRetryStep('succeeded')).toBe(false);
    expect(canReviewStep('needs_review')).toBe(true);
    expect(canReviewStep('failed')).toBe(false);
  });
  it('computeRunStatus', () => {
    expect(computeRunStatus([{required:true, status:'succeeded'}, {required:true, status:'succeeded'}])).toBe('succeeded');
    expect(computeRunStatus([{required:true, status:'failed'}])).toBe('failed');
  });
});
