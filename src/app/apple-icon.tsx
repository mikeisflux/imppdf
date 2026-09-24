import { ImageResponse } from 'next/og';

// Home-screen icon: the logo on a paper tile, same as the favicon.
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f1ea' }}>
        <svg width="132" height="132" viewBox="0 0 24 24" fill="none">
          <rect x="6" y="6" width="12" height="12" fill="#14120f" />
          <path d="M6 1v3M18 1v3M6 20v3M18 20v3M1 6h3M20 6h3M1 18h3M20 18h3" stroke="#14120f" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    ),
    size,
  );
}
