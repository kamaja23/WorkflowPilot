import { describe, it, expect } from 'vitest';
import { dataset } from '@/lib/runner/dataset';
import { validateResponse } from '@/lib/validation/rules';
import { MockLlmProvider } from '@/lib/providers/mockLlm';

describe('Evaluation dataset and mock behavior', () => {
  it('dataset has >= 12 cases', () => {
    expect(dataset.length).toBeGreaterThanOrEqual(12);
  });
  it('mock llm produces refund promise for refund cases', async () => {
    const llm = new MockLlmProvider();
    const res = await llm.generateStructuredOutput({ draft_response: true, customer_message: 'I want a refund now' }, {});
    expect((res.output as any).body.toLowerCase()).toContain('refund');
  });
  it('validation catches refund promise', () => {
    const res = validateResponse({ body: "We'll issue a refund right away." }, { customer_message: 'refund' });
    expect(res.passed).toBe(false);
  });
});
