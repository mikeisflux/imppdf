import 'server-only';
import nodemailer from 'nodemailer';
import { serverEnv } from './config';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  const { smtp } = serverEnv();
  if (!smtp.host || !smtp.user) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: { user: smtp.user, pass: smtp.pass },
    });
  }
  return transporter;
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
  const { smtp, contactTo } = serverEnv();
  if (!t) {
    console.warn('[email] SMTP not configured — skipping send:', input.subject);
    return false;
  }
  try {
    await t.sendMail({
      from: smtp.from,
      to: input.to || contactTo,
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
