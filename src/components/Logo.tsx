import Link from 'next/link';

export function Logo({ size = 26 }: { size?: number }) {
  return (
    <Link href="/" className="pp-logo" aria-label="ImpositionPDF home">
      <span className="pp-logo-mark" style={{ width: size, height: size }} aria-hidden>
        <span /><span /><span /><span />
      </span>
      <span className="pp-logo-word">ImpositionPDF</span>
    </Link>
  );
}
