import { NextResponse } from 'next/server';
import { repositories } from '@/lib/db';

export async function GET() {
  try {
    const workflows = await repositories.getWorkflows();
    return NextResponse.json({ workflows });
  } catch (e: any) {
    return NextResponse.json({ error: { code: 'INTERNAL', message: e.message } }, { status: 500 });
  }
}
