import { NextResponse } from 'next/server';
import { repositories } from '@/lib/db';

export async function POST(_req: Request, { params }: { params: { id: string, stepId: string } }) {
  try {
    const steps = await repositories.getStepsForRun(params.id);
    const step = steps.find(s => s.id === params.stepId);
    if (!step) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Step not found' } }, { status: 404 });
    if (step.status !== 'failed') return NextResponse.json({ error: { code: 'NOT_ELIGIBLE', message: 'Only failed steps can be retried' } }, { status: 400 });
    
    const newAttempt = (step.attempt || 1) + 1;
    await repositories.updateStep(step.id, { status: 'queued', attempt: newAttempt, error_code: null, error_message: null, finished_at: null });
    await repositories.createStepAttempt(step.id, newAttempt, { status: 'running' });
    
    // For MVP with mock, re-run just this step's logic simply by marking running again and re-executing quickly
    // Simplified: mark as running/succeeded for demo determinism
    setTimeout(async () => {
      try {
        await repositories.updateStep(step.id, { status: 'succeeded', finished_at: new Date(), output: { retried: true, attempt: newAttempt } });
        const attempts = await repositories.getStepAttempts(step.id);
        if (attempts[attempts.length - 1]) {
          await repositories.updateStepAttempt(attempts[attempts.length - 1].id, { status: 'succeeded', finished_at: new Date(), output: { retried: true } });
        }
      } catch (e) {}
    }, 100);
    
    return NextResponse.json({ ok: true, step_id: step.id, attempt: newAttempt });
  } catch (e: any) {
    return NextResponse.json({ error: { code: 'INTERNAL', message: e.message } }, { status: 500 });
  }
}
