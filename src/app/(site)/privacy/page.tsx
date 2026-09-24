import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Privacy Policy',
  description: 'How ImpositionPDF handles your data. Your PDFs are imposed locally in your browser and never uploaded to our servers.',
  path: '/privacy',
});

export default function PrivacyPage() {
  return (
    <div className="container" style={{ maxWidth: 820, paddingBottom: 60 }}>
      <div className="page-hero">
        <div className="eyebrow">Privacy Policy · updated 2026</div>
        <h1>Privacy Policy</h1>
        <p className="lede">Your PDFs are imposed by your own browser and never uploaded. This is everything else we do and do not keep.</p>
      </div>

      {[
        ['Document contents stay on your device', 'ImpositionPDF processes your files entirely in your browser. Document contents are never uploaded to or stored on our servers. The imposition engine performs all work locally in memory using the browser File API.'],
        ['What we do collect', 'If you create an account, we store your email address, a hashed password, and your subscription status so we can provide Pro features. We record anonymous usage counts (number of downloads and API calls) to enforce plan limits — never the contents of your files.'],
        ['Payments', 'Subscriptions are handled by PayPal, which acts as the payment processor. We store only the resulting subscription identifier and status. We never see or store your card details.'],
        ['Contact form', 'Messages you send through the contact form are delivered by email and stored so we can respond. We only use this information to reply to your inquiry.'],
        ['reCAPTCHA', 'Forms are protected by Google reCAPTCHA to prevent abuse. Your use of reCAPTCHA is subject to Google’s Privacy Policy and Terms.'],
        ['Cookies', 'We use a single essential session cookie to keep you signed in. We do not use advertising or third-party tracking cookies.'],
        ['Your rights', 'You can request deletion of your account and associated data at any time via the contact form.'],
      ].map(([t, b]) => (
        <div key={t} className="legal-row">
          <h2>{t}</h2>
          <p>{b}</p>
        </div>
      ))}
    </div>
  );
}
