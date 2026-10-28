import { NextResponse } from 'next/server';
import { repositories } from '@/lib/db';
import { mockIssueTracker } from '@/lib/integrations/mockIssue';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const idempotencyKey = `${params.id}:manual_escalate`;
    const issue = await mockIssueTracker.createIssue({ title: `WorkflowPilot manual escalation: ${params.id}`, description: `Manual escalation requested.`, labels: ['workflowpilot', 'manual-escalation'], idempotencyKey });
    await repositories.createIntegrationEvent({ run_id: params.id, provider: 'jira-mock', event_type: 'manual_escalate', status: 'simulated', external_id: issue.externalId, details: { url: issue.url, mocked: true, idempotencyKey } });
    return NextResponse.json({ ok: true, externalId: issue.externalId, url: issue.url, mocked: true });
  } catch (e: any) {
    return NextResponse.json({ error: { code: 'INTERNAL', message: e.message } }, { status: 500 });
  }
}
