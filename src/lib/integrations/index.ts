import { IssueTracker } from '../types';
import { mockIssueTracker } from './mockIssue';
import { jiraRest } from './jiraRest';

export function getIssueTracker(): IssueTracker & { isLive?: boolean } {
  if (jiraRest.isConfigured()) {
    return Object.assign(jiraRest, { isLive: true });
  }
  return Object.assign(mockIssueTracker, { isLive: false });
}

export const issueTracker = getIssueTracker();
export default issueTracker;
