import { NextResponse } from 'next/server';
import { publicConfig } from '@/lib/settings';

export const dynamic = 'force-dynamic';

// Non-secret configuration the browser needs at runtime (reCAPTCHA site key,
// PayPal client id + plan ids, prices, free-tier limits). Read live from the DB
// so admin changes take effect without a rebuild.
export function GET() {
  return NextResponse.json(publicConfig(), {
    headers: { 'Cache-Control': 'no-store' },
  });
}
