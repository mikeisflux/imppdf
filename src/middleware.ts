import { NextResponse, type NextRequest } from 'next/server';
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

export function middleware(req: NextRequest) {
  const ua = req.headers.get('user-agent') ?? '';

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
