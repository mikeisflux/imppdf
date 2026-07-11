import { ContactForm } from '@/components/forms/ContactForm';
import { pageMetadata } from '@/lib/seo';
import { siteContact } from '@/lib/config';

export const metadata = pageMetadata({
  title: 'Contact',
  description: 'Get in touch with ImpositionPDF — support, enterprise licensing and general enquiries. Call or send a message.',
  path: '/contact',
});

export default function ContactPage() {
  return (
    <div className="container" style={{ maxWidth: 760, padding: '64px 24px 90px' }}>
      <div className="eyebrow">Contact</div>
      <h1 style={{ fontSize: 'clamp(30px,4vw,42px)', marginBottom: 14 }}>Get in touch</h1>
      <p className="muted" style={{ fontSize: 17, marginBottom: 34, maxWidth: 560 }}>
        Questions about imposition, Pro billing, or team licensing? Send a message and it
        reaches us directly — every submission is delivered by email and logged securely.
      </p>
      <p className="muted" style={{ fontSize: 16, marginBottom: 28 }}>
        Prefer to talk? Call us at{' '}
        <a href={siteContact.phoneHref} style={{ color: 'var(--brand, #6d5efc)', fontWeight: 600 }}>
          {siteContact.phoneDisplay}
        </a>.
      </p>
      <div className="card card-pad">
        <ContactForm />
      </div>
      <p className="muted" style={{ marginTop: 20, fontSize: 14 }}>
        This form is protected by reCAPTCHA. We only use your email to reply to your enquiry.
      </p>
    </div>
  );
}
