import 'server-only';
import nodemailer from 'nodemailer';
import { serverEmail } from './settings';

export interface MailInput {
  to?: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}

// Parse a "Name <email>" (or bare "email") From value.
function parseFrom(from: string): { email: string; name?: string } {
  const m = from.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (m) return { name: m[1] || undefined, email: m[2].trim() };
  return { email: from.trim() };
}

async function sendViaSendgrid(
  cfg: ReturnType<typeof serverEmail>,
  input: MailInput,
): Promise<boolean> {
  const from = parseFrom(cfg.from);
  const content: { type: string; value: string }[] = [
    { type: 'text/plain', value: input.text },
  ];
  if (input.html) content.push({ type: 'text/html', value: input.html });

  try {
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cfg.sendgridApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: input.to || cfg.contactEmail }] }],
        from: from.name ? { email: from.email, name: from.name } : { email: from.email },
        ...(input.replyTo ? { reply_to: { email: input.replyTo } } : {}),
        subject: input.subject,
        content,
      }),
    });
    if (res.status >= 200 && res.status < 300) return true;
    console.error('[email] SendGrid failed:', res.status, await res.text().catch(() => ''));
    return false;
  } catch (err) {
    console.error('[email] SendGrid error:', err);
    return false;
  }
}

async function sendViaSmtp(
  cfg: ReturnType<typeof serverEmail>,
  input: MailInput,
): Promise<boolean> {
  const { smtp } = cfg;
  if (!smtp.host || !smtp.user) {
    console.warn('[email] SMTP not configured — skipping send:', input.subject);
    return false;
  }
  try {
    const t = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: { user: smtp.user, pass: smtp.pass },
    });
    await t.sendMail({
      from: cfg.from,
      to: input.to || cfg.contactEmail,
      subject: input.subject,
      text: input.text,
      html: input.html,
      replyTo: input.replyTo,
    });
    return true;
  } catch (err) {
    console.error('[email] SMTP send failed:', err);
    return false;
  }
}

// Sends via the configured provider (SendGrid API preferred), falling back to
// SMTP. Returns true only if the message was actually accepted for delivery.
export async function sendMail(input: MailInput): Promise<boolean> {
  const cfg = serverEmail();
  if (cfg.provider === 'sendgrid' && cfg.sendgridApiKey) {
    return sendViaSendgrid(cfg, input);
  }
  return sendViaSmtp(cfg, input);
}
