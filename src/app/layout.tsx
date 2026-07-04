import type { Metadata } from 'next';
import './globals.css';
import { siteName, siteUrl } from '@/lib/config';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} — Browser-based PDF imposition & prepress`,
    template: `%s · ${siteName}`,
  },
  description:
    'Impose, mark up and export print-ready PDFs in your browser. Booklets, N-up, step & repeat, cards, gang sheets, bleed and crop marks, variable data — nothing uploaded.',
  openGraph: { title: siteName, siteName, url: siteUrl, type: 'website' },
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
