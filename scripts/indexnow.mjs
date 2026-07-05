#!/usr/bin/env node
// IndexNow submitter — tells Bing, Yandex and other IndexNow search engines
// which URLs changed so they recrawl quickly. Run after a deploy:
//
//   INDEXNOW_KEY=<32+ hex chars> NEXT_PUBLIC_SITE_URL=https://impositionpdf.com \
//     node scripts/indexnow.mjs
//
// The key must also be reachable as a static text file at the site root
// (https://<host>/<key>.txt containing just the key). This script writes that
// file into public/ for you if it's missing, so `next build` publishes it.
//
// URLs are pulled from the site's own /sitemap.xml. This is deploy tooling, not
// an app API route — it only reads the sitemap and POSTs to IndexNow.
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || '').replace(/\/$/, '');
const key = process.env.INDEXNOW_KEY;

if (!siteUrl) { console.error('✗ Set NEXT_PUBLIC_SITE_URL (or SITE_URL) to your live origin.'); process.exit(1); }
if (!key || key.length < 8) { console.error('✗ Set INDEXNOW_KEY to a 8–128 char hex key (e.g. `openssl rand -hex 16`).'); process.exit(1); }

const host = new URL(siteUrl).host;

// 1. Ensure the key verification file exists in public/ so it deploys.
const keyFile = join(ROOT, 'public', `${key}.txt`);
if (!existsSync(keyFile)) {
  mkdirSync(dirname(keyFile), { recursive: true });
  writeFileSync(keyFile, key, 'utf8');
  console.log(`• Wrote public/${key}.txt (commit & deploy so it's live at ${siteUrl}/${key}.txt)`);
}

// 2. Pull URLs from the live sitemap.
async function sitemapUrls() {
  try {
    const res = await fetch(`${siteUrl}/sitemap.xml`, { headers: { 'user-agent': 'indexnow-submitter' } });
    if (!res.ok) throw new Error(`sitemap ${res.status}`);
    const xml = await res.text();
    return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim()).filter(Boolean);
  } catch (e) {
    console.warn(`• Could not read ${siteUrl}/sitemap.xml (${e.message}); submitting the homepage only.`);
    return [siteUrl + '/'];
  }
}

const urlList = [...new Set(await sitemapUrls())];
if (!urlList.length) { console.error('✗ No URLs to submit.'); process.exit(1); }

// 3. Submit to IndexNow (one endpoint fans out to all participating engines).
const body = { host, key, keyLocation: `${siteUrl}/${key}.txt`, urlList };
const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify(body),
});
console.log(`IndexNow: submitted ${urlList.length} URL(s) → HTTP ${res.status} ${res.statusText}`);
// 200/202 = accepted. 422 usually means the key file isn't live yet.
process.exit(res.ok ? 0 : 1);
