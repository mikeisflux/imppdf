import 'server-only';
import { getDb } from './db';

// Runtime, admin-editable configuration. Values are stored in the `settings`
// table and override the matching environment variable. This lets an admin
// manage reCAPTCHA / PayPal / SMTP / pricing from /admin/settings without
// editing .env or rebuilding. The browser reads the public subset (no secrets)
// from /api/public-config at runtime.

// key -> env fallback variable name
const ENV_FALLBACK: Record<string, string> = {
  siteName: 'NEXT_PUBLIC_SITE_NAME',
  contactEmail: 'CONTACT_TO_EMAIL',
  recaptchaSiteKey: 'NEXT_PUBLIC_RECAPTCHA_SITE_KEY',
  recaptchaSecret: 'RECAPTCHA_SECRET_KEY',
  recaptchaVersion: 'NEXT_PUBLIC_RECAPTCHA_VERSION',
  recaptchaV3MinScore: 'RECAPTCHA_V3_MIN_SCORE',
  paypalClientId: 'NEXT_PUBLIC_PAYPAL_CLIENT_ID',
  paypalSecret: 'PAYPAL_CLIENT_SECRET',
  paypalEnv: 'PAYPAL_ENV',
  paypalWebhookId: 'PAYPAL_WEBHOOK_ID',
  paypalPlanMonthly: 'NEXT_PUBLIC_PAYPAL_PLAN_MONTHLY',
  paypalPlanYearly: 'NEXT_PUBLIC_PAYPAL_PLAN_YEARLY',
  priceMonthly: 'NEXT_PUBLIC_PRICE_MONTHLY',
  priceYearly: 'NEXT_PUBLIC_PRICE_YEARLY',
  currency: 'NEXT_PUBLIC_CURRENCY',
  smtpHost: 'SMTP_HOST',
  smtpPort: 'SMTP_PORT',
  smtpSecure: 'SMTP_SECURE',
  smtpUser: 'SMTP_USER',
  smtpPass: 'SMTP_PASS',
  smtpFrom: 'SMTP_FROM',
  freeDownloadLimit: 'NEXT_PUBLIC_FREE_DOWNLOAD_LIMIT',
  freeCooldownHours: 'NEXT_PUBLIC_FREE_COOLDOWN_HOURS',
};

const DEFAULTS: Record<string, string> = {
  siteName: 'ImpositionPDF',
  recaptchaVersion: 'v2',
  recaptchaV3MinScore: '0.5',
  paypalEnv: 'sandbox',
  priceMonthly: '12',
  priceYearly: '120',
  currency: 'USD',
  smtpPort: '587',
  smtpSecure: 'false',
  smtpFrom: 'ImpositionPDF <no-reply@impositionpdf.com>',
  contactEmail: 'divinitycomicsinc@gmail.com',
  freeDownloadLimit: '5',
  freeCooldownHours: '8',
};

// Full list of admin-editable keys, grouped for the settings form.
export const SETTING_GROUPS: { title: string; note?: string; keys: { key: string; label: string; type?: 'text' | 'password' | 'number' | 'select'; options?: string[]; placeholder?: string }[] }[] = [
  {
    title: 'Site',
    keys: [
      { key: 'siteName', label: 'Site name' },
      { key: 'contactEmail', label: 'Contact form recipient email', placeholder: 'you@example.com' },
    ],
  },
  {
    title: 'Google reCAPTCHA',
    note: 'Protects every form. Add your domain in the reCAPTCHA admin console.',
    keys: [
      { key: 'recaptchaVersion', label: 'Version', type: 'select', options: ['v2', 'v3'] },
      { key: 'recaptchaSiteKey', label: 'Site key (public)' },
      { key: 'recaptchaSecret', label: 'Secret key', type: 'password' },
      { key: 'recaptchaV3MinScore', label: 'v3 minimum score', type: 'number' },
    ],
  },
  {
    title: 'PayPal',
    note: 'Subscriptions. Use the live credentials + your two subscription Plan IDs.',
    keys: [
      { key: 'paypalEnv', label: 'Environment', type: 'select', options: ['sandbox', 'live'] },
      { key: 'paypalClientId', label: 'Client ID (public)' },
      { key: 'paypalSecret', label: 'Client secret', type: 'password' },
      { key: 'paypalWebhookId', label: 'Webhook ID' },
      { key: 'paypalPlanMonthly', label: 'Monthly plan ID', placeholder: 'P-xxxxxxxx' },
      { key: 'paypalPlanYearly', label: 'Yearly plan ID', placeholder: 'P-xxxxxxxx' },
    ],
  },
  {
    title: 'Pricing (display)',
    note: 'Shown on the pricing page. The actual charge is set by the PayPal plan.',
    keys: [
      { key: 'priceMonthly', label: 'Monthly price', type: 'number' },
      { key: 'priceYearly', label: 'Yearly price', type: 'number' },
      { key: 'currency', label: 'Currency', placeholder: 'USD' },
    ],
  },
  {
    title: 'Free tier',
    keys: [
      { key: 'freeDownloadLimit', label: 'Free downloads total', type: 'number' },
      { key: 'freeCooldownHours', label: 'Cooldown between downloads (hours)', type: 'number' },
    ],
  },
  {
    title: 'SMTP (email)',
    note: 'Delivers the contact form. For Gmail use an App Password.',
    keys: [
      { key: 'smtpHost', label: 'Host', placeholder: 'smtp.gmail.com' },
      { key: 'smtpPort', label: 'Port', type: 'number' },
      { key: 'smtpSecure', label: 'Use TLS (secure)', type: 'select', options: ['false', 'true'] },
      { key: 'smtpUser', label: 'Username' },
      { key: 'smtpPass', label: 'Password', type: 'password' },
      { key: 'smtpFrom', label: 'From address' },
    ],
  },
];

export const SETTING_KEYS = Object.keys(ENV_FALLBACK);
const SECRET_KEYS = new Set(['recaptchaSecret', 'paypalSecret', 'smtpPass']);

function readAll(): Record<string, string> {
  const rows = getDb().prepare('SELECT key, value FROM settings').all() as
    { key: string; value: string }[];
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;
  return map;
}

// Resolve one key: DB value (if set & non-empty) → env var → built-in default.
export function get(key: string, dbMap?: Record<string, string>): string {
  const db = dbMap ?? readAll();
  if (db[key] !== undefined && db[key] !== '') return db[key];
  const envName = ENV_FALLBACK[key];
  const env = envName ? process.env[envName] : undefined;
  if (env !== undefined && env !== '') return env;
  return DEFAULTS[key] ?? '';
}

export function setMany(values: Record<string, string>) {
  const db = getDb();
  const now = Date.now();
  const stmt = db.prepare(
    `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
  );
  const tx = db.transaction((entries: [string, string][]) => {
    for (const [k, v] of entries) if (SETTING_KEYS.includes(k)) stmt.run(k, v, now);
  });
  tx(Object.entries(values));
}

// Admin form view — non-secret values are shown; secrets are masked to a boolean
// so the UI can show "configured" without leaking the value.
export function adminView() {
  const db = readAll();
  const out: Record<string, { value: string; isSecret: boolean; isSet: boolean }> = {};
  for (const key of SETTING_KEYS) {
    const isSecret = SECRET_KEYS.has(key);
    out[key] = {
      value: isSecret ? '' : get(key, db),
      isSecret,
      isSet: Boolean(db[key] || (ENV_FALLBACK[key] && process.env[ENV_FALLBACK[key]])),
    };
  }
  return out;
}

// ── Typed server accessors ───────────────────────────────────────────────────

export function serverRecaptcha() {
  const db = readAll();
  const secret = get('recaptchaSecret', db);
  return {
    siteKey: get('recaptchaSiteKey', db),
    secret,
    version: (get('recaptchaVersion', db) || 'v2') as 'v2' | 'v3',
    minScore: Number(get('recaptchaV3MinScore', db) || '0.5'),
  };
}

export function serverPaypal() {
  const db = readAll();
  return {
    clientId: get('paypalClientId', db),
    secret: get('paypalSecret', db),
    env: (get('paypalEnv', db) || 'sandbox') as 'sandbox' | 'live',
    webhookId: get('paypalWebhookId', db),
    planMonthly: get('paypalPlanMonthly', db),
    planYearly: get('paypalPlanYearly', db),
    configured: Boolean(get('paypalClientId', db) && get('paypalSecret', db)),
  };
}

export function serverSmtp() {
  const db = readAll();
  return {
    host: get('smtpHost', db),
    port: Number(get('smtpPort', db) || '587'),
    secure: get('smtpSecure', db) === 'true',
    user: get('smtpUser', db),
    pass: get('smtpPass', db),
    from: get('smtpFrom', db),
    contactEmail: get('contactEmail', db),
  };
}

export function freeTierConfig() {
  const db = readAll();
  return {
    downloadLimit: Number(get('freeDownloadLimit', db) || '5'),
    cooldownHours: Number(get('freeCooldownHours', db) || '8'),
  };
}

// Public config sent to the browser (no secrets).
export function publicConfig() {
  const db = readAll();
  return {
    siteName: get('siteName', db),
    recaptcha: {
      siteKey: get('recaptchaSiteKey', db),
      version: (get('recaptchaVersion', db) || 'v2') as 'v2' | 'v3',
    },
    paypal: {
      clientId: get('paypalClientId', db),
      planMonthly: get('paypalPlanMonthly', db),
      planYearly: get('paypalPlanYearly', db),
      configured: Boolean(get('paypalClientId', db)),
    },
    pricing: {
      monthly: get('priceMonthly', db),
      yearly: get('priceYearly', db),
      currency: get('currency', db),
    },
    freeTier: {
      downloadLimit: Number(get('freeDownloadLimit', db) || '5'),
      cooldownHours: Number(get('freeCooldownHours', db) || '8'),
    },
  };
}

export type PublicConfig = ReturnType<typeof publicConfig>;
