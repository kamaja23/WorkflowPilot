import { describe, it, expect } from 'vitest';
import { validateResponse } from '@/lib/validation/rules';

describe('Validators', () => {
  it('passes good response', () => {
    const res = validateResponse({ body: 'Thank you for reaching out. Here are the steps to resolve your billing question.' }, { customer_message: 'billing question' });
    expect(res.passed).toBe(true);
  });
  it('fails on refund promise', () => {
    const res = validateResponse({ body: "I'm sorry. We'll issue a refund for your purchase right away." }, { customer_message: 'I want a refund' });
    expect(res.passed).toBe(false);
    expect(res.issues).toContain('unsupported_promise_refund');
  });
  it('fails on short response', () => {
    const res = validateResponse({ body: 'ok' }, { customer_message: 'help' });
    expect(res.passed).toBe(false);
  });
});
