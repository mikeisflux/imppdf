import Link from 'next/link';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'About',
  description: 'About ImpositionPDF — free, browser-based PDF imposition and prepress software. Impose booklets, N-up, gang sheets and more with nothing uploaded.',
  path: '/about',
});

export default function AboutPage() {
  return (
    <div className="container" style={{ maxWidth: 780, padding: '64px 24px 40px' }}>
      <h1 style={{ fontSize: 'clamp(32px,4.4vw,46px)', marginBottom: 18 }}>About ImpositionPDF</h1>
      <p className="muted" style={{ fontSize: 18, marginBottom: 34 }}>
        ImpositionPDF is a browser-based PDF imposition and prepress tool built for print
        professionals, designers, and production teams.
      </p>

      <Section title="What ImpositionPDF does">
        ImpositionPDF arranges pages into print-ready layouts like booklets, n-up grids, gang
        sheets, and cut-and-stack runs. It also adds production marks, header/footer info,
        and other prepress details so your output is ready for press or finishing.
      </Section>

      <Section title="Imposition only — no content editing">
        ImpositionPDF is a layout and imposition tool. It rearranges, transforms, and imposes
        existing PDF pages for printing. It does not alter the contents of your documents —
        only the arrangement and presentation for print production.
      </Section>

      <Section title="Privacy-first workflow">
        Your files are processed entirely in your browser. We do not upload, transmit, or
        store document contents on our servers. Optional sign-in is only used for
        subscriptions and usage limits. Read the full policy on the <Link href="/privacy" style={{ color: 'var(--brand)' }}>Privacy page</Link>.
      </Section>

      <Section title="Who it is for">
        Print shops and production teams, designers and prepress operators, publishers and
        studios producing booklets or catalogs, packaging and label manufacturers — anyone
        preparing files for commercial or digital printing.
      </Section>

      <p className="muted" style={{ marginTop: 20 }}>
        For questions, support, or feedback, visit our <Link href="/contact" style={{ color: 'var(--brand)' }}>Contact page</Link>.
        Review <Link href="/pricing" style={{ color: 'var(--brand)' }}>Pricing</Link> and{' '}
        <Link href="/terms" style={{ color: 'var(--brand)' }}>Terms of Service</Link> for plan details.
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 30 }}>
      <h2 style={{ fontSize: 21, marginBottom: 10 }}>{title}</h2>
      <p className="muted" style={{ fontSize: 15.5, lineHeight: 1.7 }}>{children}</p>
    </div>
  );
}
