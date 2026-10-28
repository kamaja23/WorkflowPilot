import { NextResponse } from 'next/server';
import { repositories } from '@/lib/db';

export async function GET() {
  try {
    const runs = await repositories.getRuns(50);
    return NextResponse.json({ runs });
  } catch (e: any) {
    return NextResponse.json({ error: { code: 'INTERNAL', message: e.message } }, { status: 500 });
  }
}
