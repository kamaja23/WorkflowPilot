import { NextResponse } from 'next/server';
import { repositories } from '@/lib/db';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const run = await repositories.getRun(params.id);
    if (!run) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Run not found' } }, { status: 404 });
    const steps = await repositories.getStepsForRun(params.id);
    const stepsWithAttempts = await Promise.all(steps.map(async (s) => ({ ...s, attempts: await repositories.getStepAttempts(s.id) })));
    return NextResponse.json({ run, steps: stepsWithAttempts });
  } catch (e: any) {
    return NextResponse.json({ error: { code: 'INTERNAL', message: e.message } }, { status: 500 });
  }
}
