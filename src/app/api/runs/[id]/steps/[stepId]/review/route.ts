import { NextResponse } from 'next/server';
import { repositories } from '@/lib/db';

export async function POST(req: Request, { params }: { params: Promise<{ id: string, stepId: string }> }) {
  try {
    const { id, stepId } = await params;
    const body = await req.json().catch(() => ({}));
    const steps = await repositories.getStepsForRun(id);
    const step = steps.find(s => s.id === stepId);
    if (!step) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Step not found' } }, { status: 404 });
    if (step.status !== 'needs_review') return NextResponse.json({ error: { code: 'NOT_ELIGIBLE', message: 'Only needs_review steps can be reviewed' } }, { status: 400 });
    
    if (body.decision === 'approve') {
      await repositories.updateStep(step.id, { status: 'succeeded', finished_at: new Date(), output: { ...(step.output || {}), review: { decision: 'approve', note: body.note } } });
    } else if (body.decision === 'reject') {
      await repositories.updateStep(step.id, { status: 'failed', finished_at: new Date(), error_code: 'REVIEW_REJECTED', error_message: body.note || 'Rejected by reviewer', output: { ...(step.output || {}), review: { decision: 'reject', note: body.note } } });
    } else {
      return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'decision must be approve or reject' } }, { status: 400 });
    }
    
    // Check if run can be finalized
    const allSteps = await repositories.getStepsForRun(id);
    const requiredFailed = allSteps.some(s => (s as any).required !== false && s.status === 'failed');
    if (requiredFailed) {
      await repositories.finalizeRun(id, 'failed', 'Rejected after review');
    } else if (allSteps.every(s => s.status === 'succeeded' || s.status === 'skipped')) {
      await repositories.finalizeRun(id, 'succeeded');
    }
    
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: { code: 'INTERNAL', message: e.message } }, { status: 500 });
  }
}
