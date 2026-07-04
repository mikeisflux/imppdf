export const metadata = { title: 'Privacy Policy' };

export default function PrivacyPage() {
  return (
    <div className="container" style={{ maxWidth: 780, padding: '64px 24px 40px' }}>
      <h1 style={{ fontSize: 'clamp(30px,4vw,42px)', marginBottom: 8 }}>Privacy Policy</h1>
      <p className="muted" style={{ marginBottom: 30 }}>Last updated 2026</p>

      {[
        ['Document contents stay on your device', 'ImpositionPDF processes your files entirely in your browser. Document contents are never uploaded to or stored on our servers. The imposition engine performs all work locally in memory using the browser File API.'],
        ['What we do collect', 'If you create an account, we store your email address, a hashed password, and your subscription status so we can provide Pro features. We record anonymous usage counts (number of downloads and API calls) to enforce plan limits — never the contents of your files.'],
        ['Payments', 'Subscriptions are handled by PayPal, which acts as the payment processor. We store only the resulting subscription identifier and status. We never see or store your card details.'],
        ['Contact form', 'Messages you send through the contact form are delivered by email and stored so we can respond. We only use this information to reply to your enquiry.'],
        ['reCAPTCHA', 'Forms are protected by Google reCAPTCHA to prevent abuse. Your use of reCAPTCHA is subject to Google’s Privacy Policy and Terms.'],
        ['Cookies', 'We use a single essential session cookie to keep you signed in. We do not use advertising or third-party tracking cookies.'],
        ['Your rights', 'You can request deletion of your account and associated data at any time via the contact form.'],
      ].map(([t, b]) => (
        <div key={t} style={{ marginBottom: 26 }}>
          <h2 style={{ fontSize: 20, marginBottom: 8 }}>{t}</h2>
          <p className="muted" style={{ lineHeight: 1.7 }}>{b}</p>
        </div>
      ))}
    </div>
  );
}
