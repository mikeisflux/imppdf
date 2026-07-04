import { badRequest, clientIp, isValidEmail, json } from '@/lib/http';
import { verifyRecaptcha } from '@/lib/recaptcha';
import { saveContactMessage } from '@/lib/contact';
import { sendMail } from '@/lib/email';
import { serverSmtp } from '@/lib/settings';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return badRequest('Invalid request.');
  const { name, email, subject, topic, message, recaptchaToken } = body as Record<string, string>;

  const captcha = await verifyRecaptcha(recaptchaToken, clientIp(req));
  if (!captcha.ok) return badRequest(captcha.error || 'CAPTCHA failed.');

  if (!name?.trim()) return badRequest('Please enter your name.');
  if (!email || !isValidEmail(email)) return badRequest('Please enter a valid email.');
  if (!message?.trim() || message.trim().length < 5) return badRequest('Please enter a message.');

  const to = serverSmtp().contactEmail;
  const topicLabel = topic || 'general';
  const subjLine = `[ImpositionPDF · ${topicLabel}] ${subject || 'New message'}`;

  const emailed = await sendMail({
    to,
    replyTo: email,
    subject: subjLine,
    text: `From: ${name} <${email}>\nTopic: ${topicLabel}\n\n${message}`,
    html: `<p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
           <p><strong>Topic:</strong> ${escapeHtml(topicLabel)}</p>
           <p><strong>Subject:</strong> ${escapeHtml(subject || '—')}</p>
           <hr/><p style="white-space:pre-wrap">${escapeHtml(message)}</p>`,
  });

  // Always persist so nothing is lost even if SMTP is unavailable.
  saveContactMessage({ name, email, subject, topic, message, emailed });

  return json({ ok: true, emailed });
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string
  ));
}
