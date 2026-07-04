import { json } from '@/lib/http';
import { destroyAdminSession } from '@/lib/auth';

export async function POST() {
  await destroyAdminSession();
  return json({ ok: true });
}
