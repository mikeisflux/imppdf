import Link from 'next/link';

// A sheet with its crop marks — the mark is the thing the product makes.
export function Logo({ size = 24 }: { size?: number }) {
  return (
    <Link href="/" className="pp-logo" aria-label="ImpositionPDF home">
      <svg className="pp-logo-mark" width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="6" y="6" width="12" height="12" fill="currentColor" />
        <path d="M6 1v3M18 1v3M6 20v3M18 20v3M1 6h3M20 6h3M1 18h3M20 18h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <span className="pp-logo-word">ImpositionPDF</span>
    </Link>
  );
}
