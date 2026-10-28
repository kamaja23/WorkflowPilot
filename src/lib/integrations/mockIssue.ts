import { IssueTracker, IssueResult } from '../types';
import { repositories } from '../db';

export class MockIssueTracker implements IssueTracker {
  async createIssue(input: { title: string; description: string; labels?: string[]; idempotencyKey: string }): Promise<IssueResult> {
    const externalId = `MOCK-JIRA-${Buffer.from(input.idempotencyKey).toString('base64').substring(0, 12)}`;
    const url = `https://jira.mock.local/browse/${externalId}`;
    
    // Record event if we can extract context - caller will pass runId/stepId separately
    return { externalId, url };
  }
}

export const mockIssueTracker = new MockIssueTracker();
export default mockIssueTracker;
