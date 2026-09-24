import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Terms of Service',
  description: 'The terms that govern your use of ImpositionPDF, our free browser-based PDF imposition and prepress software.',
  path: '/terms',
});

export default function TermsPage() {
  return (
    <div className="container" style={{ maxWidth: 820, paddingBottom: 60 }}>
      <div className="page-hero">
        <div className="eyebrow">Terms of Service · updated 2026</div>
        <h1>Terms of Service</h1>
        <p className="lede">The short version: use it for lawful printing, verify a sheet before you run it, and cancel whenever you like.</p>
      </div>

      {[
        ['Service', 'ImpositionPDF provides browser-based PDF imposition and prepress tools. The tool arranges and transforms existing PDF pages; it does not edit document content.'],
        ['Accounts', 'You are responsible for keeping your account credentials secure. You must provide accurate information when creating an account.'],
        ['Free and Pro plans', 'The free tier includes a limited number of downloads with a cooldown between them. Pro subscriptions remove these limits. Plan details are shown on the Pricing page.'],
        ['Billing', 'Pro subscriptions are billed through PayPal on a recurring basis until canceled. You can cancel at any time from your account page; access continues until the end of the current billing period.'],
        ['Refunds', 'If you are not satisfied, contact us within 14 days of a charge and we will review your request. Refunds are issued at our discretion for unused subscription periods.'],
        ['Acceptable use', 'You may not use ImpositionPDF to process unlawful content or to abuse the service, including attempts to bypass plan limits or overload the API.'],
        ['Disclaimer', 'The service is provided “as is”. Always verify imposed output before committing to a print run. We are not liable for print costs arising from files exported through the tool.'],
        ['Changes', 'We may update these terms from time to time. Continued use of the service constitutes acceptance of the updated terms.'],
      ].map(([t, b]) => (
        <div key={t} className="legal-row">
          <h2>{t}</h2>
          <p>{b}</p>
        </div>
      ))}
    </div>
  );
}
