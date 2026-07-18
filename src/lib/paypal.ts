import 'server-only';
import { serverPaypal } from './settings';

function baseUrl() {
  return serverPaypal().env === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

export function paypalConfigured() {
  const { clientId: paypalClientId, secret: paypalSecret } = serverPaypal();
  return Boolean(paypalClientId && paypalSecret);
}

async function accessToken(): Promise<string> {
  const { clientId: paypalClientId, secret: paypalSecret, env } = serverPaypal();
  const auth = Buffer.from(`${paypalClientId}:${paypalSecret}`).toString('base64');
  const res = await fetch(`${baseUrl()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`PayPal auth failed (${res.status}) on the ${env} environment — check the client ID/secret and PAYPAL_ENV in Settings.`);
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export interface PayPalSubscription {
  id: string;
  status: string;
  plan_id?: string;
  subscriber?: { email_address?: string; name?: { given_name?: string; surname?: string } };
  billing_info?: { next_billing_time?: string };
  custom_id?: string;
}

export async function getSubscription(id: string): Promise<PayPalSubscription> {
  const token = await accessToken();
  const res = await fetch(`${baseUrl()}/v1/billing/subscriptions/${id}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const env = serverPaypal().env;
    const hint = res.status === 404
      ? ` — not found on the ${env} environment (if this is a live subscription, set PAYPAL_ENV to "live")`
      : ` on the ${env} environment`;
    throw new Error(`PayPal getSubscription failed (${res.status})${hint}.`);
  }
  return (await res.json()) as PayPalSubscription;
}

// Enforce one active subscription per user: cancel every OTHER live PayPal
// subscription so a customer who checked out more than once isn't charged twice.
// Best-effort — a PayPal cancel failure still marks the row cancelled locally so
// the UI is consistent, and the webhook will reconcile the real state later.
export async function enforceSingleSubscription(userId: number, keepPaypalId: string): Promise<number> {
  const { otherLiveSubscriptions, markSubscriptionStatus } = await import('./subscriptions');
  const dups = otherLiveSubscriptions(userId, keepPaypalId);
  for (const d of dups) {
    if (!d.paypal_subscription_id) continue;
    try { await cancelSubscription(d.paypal_subscription_id, 'Superseded by a newer subscription'); } catch { /* already gone / network */ }
    markSubscriptionStatus(d.paypal_subscription_id, 'CANCELLED');
  }
  return dups.length;
}

// Change a live subscription to a different plan (monthly ↔ yearly). PayPal may
// require the subscriber to approve the change — when it does it returns an
// approval link the browser should redirect to. Once approved, PayPal fires a
// BILLING.SUBSCRIPTION.UPDATED webhook and our records re-sync.
export async function reviseSubscription(id: string, planId: string, returnUrl: string, cancelUrl: string): Promise<{ approveUrl?: string }> {
  const token = await accessToken();
  const res = await fetch(`${baseUrl()}/v1/billing/subscriptions/${id}/revise`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      plan_id: planId,
      application_context: { return_url: returnUrl, cancel_url: cancelUrl },
    }),
  });
  if (!res.ok) throw new Error(`PayPal plan change failed (${res.status}) on the ${serverPaypal().env} environment.`);
  const data = (await res.json()) as { links?: { rel: string; href: string }[] };
  const approve = data.links?.find((l) => l.rel === 'approve' || l.rel === 'edit')?.href;
  return { approveUrl: approve };
}

export async function cancelSubscription(id: string, reason = 'User requested cancellation') {
  const token = await accessToken();
  const res = await fetch(`${baseUrl()}/v1/billing/subscriptions/${id}/cancel`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
  // 204 = success. PayPal returns 422 if already cancelled — treat as success.
  if (!res.ok && res.status !== 422) {
    throw new Error(`PayPal cancel failed: ${res.status}`);
  }
}

// Verifies a webhook came from PayPal using the transmission headers + our
// configured webhook id. Returns true only on "SUCCESS".
export async function verifyWebhookSignature(
  headers: Headers,
  rawBody: string,
): Promise<boolean> {
  const { webhookId: paypalWebhookId } = serverPaypal();
  if (!paypalWebhookId) {
    console.warn('[paypal] PAYPAL_WEBHOOK_ID not set — cannot verify webhook.');
    return false;
  }
  const token = await accessToken();
  const payload = {
    auth_algo: headers.get('paypal-auth-algo'),
    cert_url: headers.get('paypal-cert-url'),
    transmission_id: headers.get('paypal-transmission-id'),
    transmission_sig: headers.get('paypal-transmission-sig'),
    transmission_time: headers.get('paypal-transmission-time'),
    webhook_id: paypalWebhookId,
    webhook_event: JSON.parse(rawBody),
  };
  const res = await fetch(`${baseUrl()}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return false;
  const data = (await res.json()) as { verification_status: string };
  return data.verification_status === 'SUCCESS';
}
