import Link from 'next/link';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'About',
  description: 'ImpositionPDF began as the in-house prepress tool of a small print shop. It lays out press sheets in the browser, on your own machine, from PDFs that are never uploaded.',
  path: '/about',
});

export default function AboutPage() {
  return (
    <div className="container" style={{ maxWidth: 820 }}>
      <div className="page-hero">
      <div className="eyebrow">About</div>
      <h1>Made in a working print shop.</h1>
      <p className="lede">
        ImpositionPDF began as the prepress tool of a small print shop that needed booklets to
        fold right, tickets to number themselves and card sheets to line up with the cutter it
        actually owned. It grew one job at a time, and it still does.
      </p>
      </div>

      <Section title="What it does">
        It takes a finished PDF and lays its pages out on a press sheet: saddle-stitched and
        perfect-bound signatures, N-up grids, step and repeat, cut and stack, gang sheets, folded
        brochures, tiled posters and dielines. It adds the marks the bindery needs, checks the file
        for the problems a RIP will choke on, and can serialize tickets, badges and labels from a
        spreadsheet.
      </Section>

      <Section title="What it does not do">
        It does not edit your pages. The words, pictures and colors in the document are placed,
        turned and repeated exactly as they arrived. Anything that changes the content — beyond
        color conversion you ask for explicitly — is somebody else’s job.
      </Section>

      <Section title="Where your file goes">
        Nowhere. The PDF is opened, imposed and written back by your own browser, on your own
        machine. There is no upload step and no server that handles document contents. An account
        exists only to carry a subscription and its download limits; the tools themselves never
        need one. The details are on the <Link href="/privacy" style={{ color: 'var(--brand)' }}>privacy page</Link>.
      </Section>

      <Section title="Who uses it">
        The people who were doing this by hand: counter staff at copy shops, prepress operators,
        designers who have to hand a printer something that will actually trim, small publishers,
        label and packaging makers, and anyone who has ever folded a test sheet to see why the
        page numbers came out wrong.
      </Section>

      <p className="muted" style={{ marginTop: 20 }}>
        Questions or something that did not work: the <Link href="/contact" style={{ color: 'var(--brand)' }}>contact page</Link>.
        Plans are on the <Link href="/pricing" style={{ color: 'var(--brand)' }}>pricing page</Link>, and the fine print is in the{' '}
        <Link href="/terms" style={{ color: 'var(--brand)' }}>terms</Link>.
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 30 }}>
      <h2 style={{ fontSize: 28, marginBottom: 10 }}>{title}</h2>
      <p style={{ fontSize: 16.5, lineHeight: 1.7, color: 'var(--ink-2)' }}>{children}</p>
    </div>
  );
}
