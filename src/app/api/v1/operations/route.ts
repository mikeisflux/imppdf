import { NextResponse } from 'next/server';
import { OPERATIONS } from '@/lib/impose-server';

// Public schema — no auth required so integrators can discover the pipeline.
export function GET() {
  return NextResponse.json({ operations: OPERATIONS });
}
