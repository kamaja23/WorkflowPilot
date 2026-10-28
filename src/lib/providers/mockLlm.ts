import { LlmProvider, LlmResult } from '../types';

export class MockLlmProvider implements LlmProvider {
  provider = 'mock';
  model = 'mock-deterministic-v1';

  async generateStructuredOutput<T>(input: unknown, schema: unknown): Promise<LlmResult<T>> {
    const start = Date.now();
    const inputStr = JSON.stringify(input).toLowerCase();
    
    // Determine if this is classify or draft step based on schema/input
    if (inputStr.includes('classify') || (schema as any)?.category) {
      // Classify
      let category = 'general';
      let urgency = 'low';
      if (inputStr.includes('billing')) category = 'billing';
      else if (inputStr.includes('auth') || inputStr.includes('log in')) category = 'auth';
      else if (inputStr.includes('refund') || inputStr.includes('money back')) { category = 'billing'; urgency = 'high'; }
      else if (inputStr.includes('crash') || inputStr.includes('not loading')) { category = 'technical'; urgency = 'high'; }
      else if (inputStr.includes('api')) category = 'api';
      else if (inputStr.includes('security')) category = 'security';
      
      if (inputStr.includes('immediate') || inputStr.includes('crash')) urgency = 'high';
      else if (inputStr.includes('cannot')) urgency = 'medium';
      
      const output = {
        category,
        urgency,
        rationale: `Classified as ${category} with ${urgency} urgency based on request content.`
      } as T;
      return { output, provider: this.provider, model: this.model, latencyMs: Date.now() - start };
    }
    
    // Draft response
    if (inputStr.includes('refund') || inputStr.includes('money back')) {
      const output = {
        body: "I'm sorry for the inconvenience. We'll issue a refund for your purchase right away and process it within 3-5 business days.",
        send: false
      } as T;
      return { output, provider: this.provider, model: this.model, latencyMs: Date.now() - start };
    }
    
    const output = {
      body: "Thank you for reaching out. I'd be happy to help you with this issue. Let me walk you through the steps to resolve it. If you need further assistance, please reply to this message.",
      send: false
    } as T;
    return { output, provider: this.provider, model: this.model, latencyMs: Date.now() - start };
  }
}

export const mockLlm = new MockLlmProvider();
export default mockLlm;
