import { NextResponse } from 'next/server';
import { repositories } from '@/lib/db';

export async function GET() {
  try {
    const summary = await repositories.getEvaluationSummary();
    const total = summary.reduce((acc: number, r: any) => acc + parseInt(r.total || 0), 0);
    const passed = summary.reduce((acc: number, r: any) => acc + parseInt(r.passed || 0), 0);
    return NextResponse.json({ summary, totals: { total, passed, passRate: total > 0 ? passed / total : 0 }, timeScope: { first_run: summary[0]?.first_run, last_run: summary[0]?.last_run } });
  } catch (e: any) {
    return NextResponse.json({ error: { code: 'INTERNAL', message: e.message } }, { status: 500 });
  }
}
