import { NextResponse } from 'next/server';
import { runWorkflow } from '@/lib/runner/runner';
import dataset from '@/lib/runner/dataset';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => ({}));
    let input = body.input;
    if (body.case_id) {
      const c = dataset.find(d => d.case_id === body.case_id);
      if (c) input = c;
    }
    // Start execution (server-side) - await for MVP (mock is fast)
    const run = await runWorkflow(params.id, input || {});
    return NextResponse.json({ run }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: { code: 'INTERNAL', message: e.message } }, { status: 500 });
  }
}
