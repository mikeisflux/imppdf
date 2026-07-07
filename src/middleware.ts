import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { isSearchEngine, isMaliciousBot } from '@/lib/bot-ua';

// Edge bot gate. Runs before every request except static assets and the SEO
// files. Policy (matches printingcomics, adapted to Next):
//   1. Search-engine + social crawlers are ALWAYS allowed — the site must stay
//      fully indexable and OG/link previews must work.
//   2. Clearly-malicious scanner user-agents get a hard 403.
//   3. Light per-IP rate limiting on /api/ to blunt abusive bursts.
// Persistent IP blocking (suspicious-activity threshold) lives in the Node
// server layer (src/lib/bot-blocker.ts), which the API routes call.

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 120;                       // API requests / IP / minute
const hits = new Map<string, { count: number; reset: number }>();

function clientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]!.trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}

function authSecret(): Uint8Array {
  return new TextEncoder().encode(process.env.AUTH_SECRET || 'insecure-dev-secret-change-me');
}

// Edge-level gate for the admin surface (defense in depth on top of the
// per-page/per-route getCurrentAdmin() check). Requires a validly-signed admin
// token with the `admin` claim; if the browser is also signed into the app as a
// DIFFERENT user, admin is refused. The DB role re-check still happens in
// getCurrentAdmin() — the edge can't reach the database.
async function adminGateOk(req: NextRequest): Promise<boolean> {
  const tok = req.cookies.get('pp_admin')?.value;
  if (!tok) return false;
  try {
    const { payload } = await jwtVerify(tok, authSecret());
    if (!payload.admin) return false;
    const adminUid = Number(payload.uid);
    const sess = req.cookies.get('pp_session')?.value;
    if (sess) {
      try {
        const { payload: sp } = await jwtVerify(sess, authSecret());
        if (Number(sp.uid) !== adminUid) return false; // acting as another user
      } catch { /* invalid user session — ignore */ }
    }
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const ua = req.headers.get('user-agent') ?? '';
  const path = req.nextUrl.pathname;

  // 0. Guard the admin UI + admin API at the edge (login endpoints excepted).
  const isAdminUi = path === '/admin' || (path.startsWith('/admin/') && path !== '/admin/login');
  const isAdminApi = path.startsWith('/api/admin/') && path !== '/api/admin/login';
  if (isAdminUi || isAdminApi) {
    if (!(await adminGateOk(req))) {
      return isAdminApi
        ? new NextResponse('Unauthorized', { status: 401 })
        : NextResponse.redirect(new URL('/admin/login', req.url));
    }
  }

  // 1. Always let real crawlers through.
  if (isSearchEngine(ua)) return NextResponse.next();

  // 2. Block obvious scanners/exploit tools.
  if (ua && isMaliciousBot(ua)) {
    return new NextResponse('Access denied', { status: 403 });
  }

  // 3. Rate-limit the API surface per IP (in-memory, best-effort at the edge).
  if (req.nextUrl.pathname.startsWith('/api/')) {
    const ip = clientIp(req);
    if (ip !== 'unknown') {
      const now = Date.now();
      const rec = hits.get(ip);
      if (!rec || rec.reset < now) {
        hits.set(ip, { count: 1, reset: now + WINDOW_MS });
      } else if (++rec.count > MAX_PER_WINDOW) {
        return new NextResponse('Too many requests', {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil((rec.reset - now) / 1000)) },
        });
      }
    }
  }

  return NextResponse.next();
}

// Skip static assets and the SEO files so crawlers fetch them freely.
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.svg|og.png|robots.txt|sitemap.xml).*)'],
};
