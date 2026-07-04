// Centralised environment/config access. Server-only values are read lazily so
// they are never bundled into client code. NEXT_PUBLIC_* values are safe on both.

export const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'PDF Press';
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const recaptcha = {
  siteKey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '',
  version: (process.env.NEXT_PUBLIC_RECAPTCHA_VERSION || 'v2') as 'v2' | 'v3',
  get enabled() {
    return Boolean(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY);
  },
};

export const paypal = {
  clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
  planMonthly: process.env.NEXT_PUBLIC_PAYPAL_PLAN_MONTHLY || '',
  planYearly: process.env.NEXT_PUBLIC_PAYPAL_PLAN_YEARLY || '',
  get enabled() {
    return Boolean(process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID);
  },
};

export const pricing = {
  monthly: process.env.NEXT_PUBLIC_PRICE_MONTHLY || '12',
  yearly: process.env.NEXT_PUBLIC_PRICE_YEARLY || '120',
  currency: process.env.NEXT_PUBLIC_CURRENCY || 'USD',
};

export const freeTier = {
  downloadLimit: Number(process.env.NEXT_PUBLIC_FREE_DOWNLOAD_LIMIT || '5'),
  cooldownHours: Number(process.env.NEXT_PUBLIC_FREE_COOLDOWN_HOURS || '8'),
};

// ── Server-only helpers ──────────────────────────────────────────────────────

export function serverEnv() {
  return {
    authSecret: process.env.AUTH_SECRET || 'insecure-dev-secret-change-me',
    databasePath: process.env.DATABASE_PATH || './data/pdfpress.db',
    contactTo: process.env.CONTACT_TO_EMAIL || 'divinitycomicsinc@gmail.com',
    recaptchaSecret: process.env.RECAPTCHA_SECRET_KEY || '',
    recaptchaV3MinScore: Number(process.env.RECAPTCHA_V3_MIN_SCORE || '0.5'),
    paypalClientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
    paypalSecret: process.env.PAYPAL_CLIENT_SECRET || '',
    paypalEnv: (process.env.PAYPAL_ENV || 'sandbox') as 'sandbox' | 'live',
    paypalWebhookId: process.env.PAYPAL_WEBHOOK_ID || '',
    smtp: {
      host: process.env.SMTP_HOST || '',
      port: Number(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
      from: process.env.SMTP_FROM || 'PDF Press <no-reply@pdfpress.app>',
    },
  };
}
