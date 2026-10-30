import { IssueTracker, IssueResult } from '../types';

export class JiraRestIssueTracker implements IssueTracker {
  private baseUrl: string;
  private email: string;
  private token: string;
  private projectKey: string;
  private cloudId: string;

  constructor() {
    this.baseUrl = process.env.JIRA_BASE_URL || '';
    this.email = process.env.JIRA_EMAIL || '';
    this.token = process.env.JIRA_API_TOKEN || '';
    this.projectKey = process.env.JIRA_PROJECT_KEY || '';
    this.cloudId = process.env.JIRA_CLOUD_ID || '';
  }

  isConfigured(): boolean {
    return !!(this.token && this.projectKey && (this.baseUrl || this.cloudId));
  }

  async createIssue(input: { title: string; description: string; labels?: string[]; idempotencyKey: string }): Promise<IssueResult> {
    if (!this.isConfigured()) {
      throw new Error('Jira not configured');
    }

    let url: string;
    let headers: any = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };

    if (this.cloudId || this.baseUrl.includes('api.atlassian.com')) {
      url = `https://api.atlassian.com/ex/jira/${this.cloudId}/rest/api/3/issue`;
      const auth = Buffer.from(`${this.email}:${this.token}`).toString('base64');
      headers['Authorization'] = `Basic ${auth}`;
    } else if (this.baseUrl.includes('atlassian.net')) {
      url = `${this.baseUrl.replace(/\/$/, '')}/rest/api/3/issue`;
      const auth = Buffer.from(`${this.email}:${this.token}`).toString('base64');
      headers['Authorization'] = `Basic ${auth}`;
    } else {
      url = `${this.baseUrl.replace(/\/$/, '')}/rest/api/3/issue`;
      const auth = Buffer.from(`${this.email}:${this.token}`).toString('base64');
      headers['Authorization'] = `Basic ${auth}`;
    }

    const body = {
      fields: {
        project: { key: this.projectKey },
        summary: input.title,
        description: {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: input.description }
              ]
            }
          ]
        },
        issuetype: { name: 'Task' },
        labels: input.labels || []
      }
    };

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Jira API error: ${res.status} ${err}`);
    }

    const data = await res.json();
    const issueUrl = this.cloudId ? `https://workflowpilot.atlassian.net/browse/${data.key}` : `${this.baseUrl.replace(/\/$/, '')}/browse/${data.key}`;
    return { externalId: data.key, url: issueUrl };
  }
}

export const jiraRest = new JiraRestIssueTracker();
export default jiraRest;
