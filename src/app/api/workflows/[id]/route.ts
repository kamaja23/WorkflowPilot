import { NextResponse } from 'next/server';
import { repositories } from '@/lib/db';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const workflow = await repositories.getWorkflowById(params.id);
    if (!workflow) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Workflow not found' } }, { status: 404 });
    return NextResponse.json({ workflow });
  } catch (e: any) {
    return NextResponse.json({ error: { code: 'INTERNAL', message: e.message } }, { status: 500 });
  }
}
