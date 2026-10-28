import { validateResponse } from './rules';

export class ValidationEngine {
  run(draft: any, ticket: any) {
    return validateResponse(draft, ticket);
  }
}

export const validationEngine = new ValidationEngine();
export default validationEngine;
