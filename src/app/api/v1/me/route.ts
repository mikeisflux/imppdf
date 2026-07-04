import { NextResponse } from 'next/server';
import { authApiKey } from '@/lib/apiauth';
import { findUserById } from '@/lib/users';

export const dynamic = 'force-dynamic';

export function GET(req: Request) {
  const auth = authApiKey(req);
  if (!auth) return NextResponse.json({ error: 'Invalid or missing API key.' }, { status: 401 });
  const user = findUserById(auth.userId);
  if (!user) return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
  return NextResponse.json({
    email: user.email,
    plan: user.plan,
    keyId: auth.keyId,
  });
}
