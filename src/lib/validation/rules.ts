export function validateResponse(draft: any, ticket: any): { passed: boolean; issues: string[]; details: any } {
  const issues: string[] = [];
  const details: any = { rules: [] };
  
  const body = draft?.body || '';
  
  // required_fields
  if (!body || body.trim().length === 0) {
    issues.push('missing_response_body');
    details.rules.push({ rule: 'required_fields', passed: false, reason: 'Response body is required' });
  } else {
    details.rules.push({ rule: 'required_fields', passed: true });
  }
  
  // min_length
  if (body.length < 20) {
    issues.push('response_too_short');
    details.rules.push({ rule: 'min_length', passed: false, reason: 'Response too short' });
  } else {
    details.rules.push({ rule: 'min_length', passed: true });
  }
  
  // no_unsupported_promises - refund/money back
  const lower = body.toLowerCase();
  if (lower.includes('refund') || lower.includes('money back')) {
    issues.push('unsupported_promise_refund');
    details.rules.push({ rule: 'no_unsupported_promises', passed: false, reason: 'Draft promises unsupported action: refund/money-back' });
  } else {
    details.rules.push({ rule: 'no_unsupported_promises', passed: true });
  }
  
  // answers_request (heuristic)
  if (ticket?.customer_message && body.length > 10) {
    details.rules.push({ rule: 'answers_request', passed: true, reason: 'Response addresses the request' });
  } else {
    details.rules.push({ rule: 'answers_request', passed: false, reason: 'Response may not fully address request' });
  }
  
  return { passed: issues.length === 0, issues, details };
}
