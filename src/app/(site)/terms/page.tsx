export const metadata = { title: 'Terms of Service' };

export default function TermsPage() {
  return (
    <div className="container" style={{ maxWidth: 780, padding: '64px 24px 40px' }}>
      <h1 style={{ fontSize: 'clamp(30px,4vw,42px)', marginBottom: 8 }}>Terms of Service</h1>
      <p className="muted" style={{ marginBottom: 30 }}>Last updated 2026</p>

      {[
        ['Service', 'PDF Press provides browser-based PDF imposition and prepress tools. The tool arranges and transforms existing PDF pages; it does not edit document content.'],
        ['Accounts', 'You are responsible for keeping your account credentials and API keys secure. You must provide accurate information when creating an account.'],
        ['Free and Pro plans', 'The free tier includes a limited number of downloads with a cooldown between them. Pro subscriptions remove these limits. Plan details are shown on the Pricing page.'],
        ['Billing', 'Pro subscriptions are billed through PayPal on a recurring basis until cancelled. You can cancel at any time from your account page; access continues until the end of the current billing period.'],
        ['Refunds', 'If you are not satisfied, contact us within 14 days of a charge and we will review your request. Refunds are issued at our discretion for unused subscription periods.'],
        ['Acceptable use', 'You may not use PDF Press to process unlawful content or to abuse the service, including attempts to bypass plan limits or overload the API.'],
        ['Disclaimer', 'The service is provided “as is”. Always verify imposed output before committing to a print run. We are not liable for print costs arising from files exported through the tool.'],
        ['Changes', 'We may update these terms from time to time. Continued use of the service constitutes acceptance of the updated terms.'],
      ].map(([t, b]) => (
        <div key={t} style={{ marginBottom: 26 }}>
          <h2 style={{ fontSize: 20, marginBottom: 8 }}>{t}</h2>
          <p className="muted" style={{ lineHeight: 1.7 }}>{b}</p>
        </div>
      ))}
    </div>
  );
}
