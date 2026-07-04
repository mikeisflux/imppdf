import { json } from '@/lib/http';
import { destroySession } from '@/lib/auth';

export async function POST() {
  await destroySession();
  return json({ ok: true });
}
