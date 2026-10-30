import { NextResponse } from 'next/server';
import { repositories } from '@/lib/db';
import { issueTracker } from '@/lib/integrations';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const idempotencyKey = `${id}:manual_escalate`;
    const isLive = (issueTracker as any).isLive;
    try {
      const issue = await issueTracker.createIssue({ title: `WorkflowPilot manual escalation: ${id}`, description: `Manual escalation requested.`, labels: ['workflowpilot', 'manual-escalation'], idempotencyKey });
      await repositories.createIntegrationEvent({ run_id: id, provider: isLive ? 'jira' : 'jira-mock', event_type: 'manual_escalate', status: isLive ? 'created' : 'simulated', external_id: issue.externalId, details: { url: issue.url, mocked: !isLive, live: isLive, idempotencyKey } });
      return NextResponse.json({ ok: true, externalId: issue.externalId, url: issue.url, mocked: !isLive, live: isLive });
    } catch (e: any) {
      await repositories.createIntegrationEvent({ run_id: id, provider: 'jira-mock', event_type: 'manual_escalate', status: 'simulated_fallback', external_id: null, details: { error: e.message } });
      return NextResponse.json({ ok: true, mocked: true, fallback: true, error: e.message });
    }
  } catch (e: any) {
    return NextResponse.json({ error: { code: 'INTERNAL', message: e.message } }, { status: 500 });
  }
}
