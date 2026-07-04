import 'server-only';
import nodemailer from 'nodemailer';
import { serverSmtp } from './settings';

// Not cached — SMTP config can change at runtime via /admin/settings.
function getTransporter(): nodemailer.Transporter | null {
  const smtp = serverSmtp();
  if (!smtp.host || !smtp.user) return null;
  return nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: { user: smtp.user, pass: smtp.pass },
  });
}

export interface MailInput {
  to?: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}

// Returns true if the email was actually sent. If SMTP is not configured the
// caller should still have persisted the message (contact form does), so a
// false return is not fatal.
export async function sendMail(input: MailInput): Promise<boolean> {
  const t = getTransporter();
  const smtp = serverSmtp();
  if (!t) {
    console.warn('[email] SMTP not configured — skipping send:', input.subject);
    return false;
  }
  try {
    await t.sendMail({
      from: smtp.from,
      to: input.to || smtp.contactEmail,
      subject: input.subject,
      text: input.text,
      html: input.html,
      replyTo: input.replyTo,
    });
    return true;
  } catch (err) {
    console.error('[email] send failed:', err);
    return false;
  }
}
