import 'server-only';
import { serverEnv } from './config';

function baseUrl() {
  return serverEnv().paypalEnv === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

export function paypalConfigured() {
  const { paypalClientId, paypalSecret } = serverEnv();
  return Boolean(paypalClientId && paypalSecret);
}

async function accessToken(): Promise<string> {
  const { paypalClientId, paypalSecret } = serverEnv();
  const auth = Buffer.from(`${paypalClientId}:${paypalSecret}`).toString('base64');
  const res = await fetch(`${baseUrl()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`PayPal auth failed: ${res.status}`);
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
  if (!res.ok) throw new Error(`PayPal getSubscription failed: ${res.status}`);
  return (await res.json()) as PayPalSubscription;
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
  const { paypalWebhookId } = serverEnv();
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
