import 'server-only';
import { resolveApiKey } from './apikeys';

// Extracts and validates a Bearer API key from a request.
export function authApiKey(req: Request):
  | { keyId: number; userId: number; plan: string }
  | null {
  const header = req.headers.get('authorization') || '';
  const m = header.match(/^Bearer\s+(.+)$/i);
  const raw = m ? m[1].trim() : req.headers.get('x-api-key')?.trim();
  if (!raw) return null;
  return resolveApiKey(raw);
}
