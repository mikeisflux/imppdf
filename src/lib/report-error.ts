// Minimal, dependency-free error reporting. If NEXT_PUBLIC_ERROR_WEBHOOK is set
// (a Sentry "store" URL, a Slack/Discord webhook, or any endpoint that accepts a
// JSON POST) client-side errors are beaconed there. When unset it's a no-op, so
// dev and un-configured deploys stay silent. This adds no dependency and no app
// API route — it POSTs to an external URL you configure.
export function reportError(error: unknown, context?: Record<string, unknown>) {
  try {
    const url = process.env.NEXT_PUBLIC_ERROR_WEBHOOK;
    // Always surface to the console so it's visible without a webhook.
    // eslint-disable-next-line no-console
    console.error('[error]', error, context ?? '');
    if (!url || typeof navigator === 'undefined') return;
    const err = error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : { message: String(error) };
    const payload = JSON.stringify({
      error: err,
      context: context ?? {},
      url: typeof location !== 'undefined' ? location.href : undefined,
      ua: navigator.userAgent,
      ts: new Date().toISOString(),
    });
    // sendBeacon survives navigation/unload; fall back to fetch keepalive.
    if (navigator.sendBeacon) navigator.sendBeacon(url, new Blob([payload], { type: 'application/json' }));
    else void fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: payload, keepalive: true });
  } catch { /* reporting must never throw */ }
}
