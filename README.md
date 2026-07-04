# ImpositionPDF

A complete website built around the **Imposition Toolkit** plugin — a browser-based
PDF imposition & prepress app (à la impositionpdf.com) with PayPal subscriptions, a full
`/admin` panel, an authenticated HTTP API, and reCAPTCHA on every form.

- **Framework:** Next.js 15 (App Router) · React 19 · TypeScript
- **Database:** SQLite (via `better-sqlite3`) — zero external services to run
- **Auth:** email + password (bcrypt) with signed JWT session cookies — **no magic links**
- **Payments:** PayPal Subscriptions (monthly & yearly) + webhook sync
- **Email:** SMTP (nodemailer) — contact form delivered to `divinitycomicsinc@gmail.com`
- **Bot protection:** Google reCAPTCHA (v2 checkbox or v3) on signup, login, contact, admin login

The imposition tool itself lives on the **front end at `/app`** (not behind `/admin`).

---

## Quick start

```bash
npm install
cp .env.example .env.local     # then fill in the values below
npm run db:init                # creates ./data/impositionpdf.db + the bootstrap admin
npm run dev                    # http://localhost:3000
```

Production:

```bash
npm run build && npm start
```

## Environment

Everything is configured through `.env.local` (see `.env.example` for the full list):

| Group | Keys |
|---|---|
| App | `NEXT_PUBLIC_SITE_URL`, `AUTH_SECRET`, `DATABASE_PATH`, `CONTACT_TO_EMAIL` |
| Admin bootstrap | `ADMIN_EMAIL`, `ADMIN_PASSWORD` (used once by `npm run db:init`) |
| reCAPTCHA | `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`, `RECAPTCHA_SECRET_KEY`, `NEXT_PUBLIC_RECAPTCHA_VERSION` |
| PayPal | `NEXT_PUBLIC_PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_ENV`, `PAYPAL_WEBHOOK_ID`, `NEXT_PUBLIC_PAYPAL_PLAN_MONTHLY`, `NEXT_PUBLIC_PAYPAL_PLAN_YEARLY` |
| Pricing / free tier | `NEXT_PUBLIC_PRICE_MONTHLY`, `NEXT_PUBLIC_PRICE_YEARLY`, `NEXT_PUBLIC_FREE_DOWNLOAD_LIMIT`, `NEXT_PUBLIC_FREE_COOLDOWN_HOURS` |
| SMTP | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` |

> If reCAPTCHA / PayPal / SMTP keys are left blank the site still runs: forms pass
> through (dev), payments show a "not configured" note, and contact submissions are
> stored in the DB (viewable in `/admin`) even when email can't be sent.

### PayPal setup

1. Create a REST app at <https://developer.paypal.com/dashboard/applications>.
2. Create a **Product** and two **Subscription Plans** (monthly + yearly); copy their
   plan IDs into `NEXT_PUBLIC_PAYPAL_PLAN_MONTHLY` / `_YEARLY`.
3. Add a **Webhook** pointing at `https://your-domain/api/paypal/webhook` subscribed to
   the `BILLING.SUBSCRIPTION.*` events; copy its id into `PAYPAL_WEBHOOK_ID`.

### reCAPTCHA setup

Create keys at <https://www.google.com/recaptcha/admin>. v2 "checkbox" is the default;
set `NEXT_PUBLIC_RECAPTCHA_VERSION=v3` to use invisible scoring instead.

---

## Routes

| Area | Path |
|---|---|
| Marketing | `/` (home), `/pricing`, `/about`, `/api-docs`, `/guide`, `/contact`, `/tools/<slug>`, `/privacy`, `/terms` |
| The app | `/app` — the imposition plugin with free-tier download gating |
| Accounts | `/signup`, `/login`, `/account` (plan, subscription, API keys) |
| Admin | `/admin/login`, `/admin` (dashboard), `/admin/users`, `/admin/subscriptions`, `/admin/keys`, `/admin/contacts` |
| HTTP API | `POST /api/v1/impose`, `GET /api/v1/operations`, `GET /api/v1/me` |

### API example

```bash
curl https://your-domain/api/v1/impose \
  -H "Authorization: Bearer imp_live_..." \
  -F file=@flyer.pdf \
  -F 'steps=[{"kind":"Grid","columns":2,"rows":2,"addMarks":true}]' \
  -o imposed.pdf
```

Create a key on `/account`. `GET /api/v1/operations` lists every supported step.

---

## Upgrading the plugin

The imposition engine + UI live in **`src/lib/imposition-toolkit/`** and are the *only*
plugin coupling point. To upgrade to a newer, more complete plugin version:

1. Replace the contents of `src/lib/imposition-toolkit/` with the new build
   (`impose.ts`, `Impose.tsx`, `impose.css`). Keep the `'use client';` directive at the
   top of `Impose.tsx`.
2. If new engine operations were added, extend **`src/lib/impose-server.ts`**
   (`OPERATIONS` + the `applyStep` switch) so the HTTP API exposes them too.
3. The marketing site is driven by **`src/lib/tools.ts`** — the tool catalog. Tools
   there flagged `inPlugin: false` are advertised now (with a "Coming soon" badge) and
   light up automatically once the new plugin ships them. Flip `inPlugin` to `true` for
   any tool the new version implements.

Nothing else needs to change: `src/components/app/AppWorkspace.tsx` mounts whatever the
plugin exports and applies the free-tier download gate around it.

See `docs/UPGRADING.md` for the detailed checklist.
