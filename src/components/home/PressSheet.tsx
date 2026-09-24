// The hero's picture is the product's own output: a Letter sheet imposed 2 × 4
// with the geometry the shop actually cuts on — cells, bleed, crop marks in the
// margins, a colour bar and a slug line — drawn straight from the fit module so
// it can never drift from what the editor produces.
import { fitDivinityCards, LAYOUT_BLEED_MM } from '@/lib/imposition-toolkit/fit/divinity-cards';

const INK = '#14120f', LINE = '#c9c3b4', ACCENT = '#ff4f1f';
const BAR = ['#00b4e6', '#e6007e', '#ffd400', '#14120f', '#40c7ec', '#ec40a0', '#ffdf40', '#4f4d4a'];

export function PressSheet() {
  const fit = fitDivinityCards('letter');
  const W = fit.sheetWMm, H = fit.sheetHMm, B = LAYOUT_BLEED_MM;
  // PDF y runs up; SVG y runs down.
  const cells = fit.cells.map((c) => ({ x: c.xMm, y: H - c.yMm - c.hMm, w: c.wMm, h: c.hMm }));
  const xs = [...new Set(cells.flatMap((c) => [c.x, c.x + c.w]))];
  const ys = [...new Set(cells.flatMap((c) => [c.y, c.y + c.h]))];
  const tick = 3, off = 1.2;
  const firstCut = Math.min(...ys), lastCut = Math.max(...ys);

  return (
    <svg
      className="press-sheet"
      viewBox={`-6 -6 ${W + 12} ${H + 12}`}
      role="img"
      aria-label={`A Letter sheet imposed two by four: eight cards with bleed, crop marks, a colour bar and a slug line`}
      style={{ ['--ps-travel' as string]: `${lastCut - firstCut}px` }}
    >
      <rect x="0" y="0" width={W} height={H} fill="#fff" />

      {/* bleed boxes, then the cards */}
      {cells.map((c, i) => (
        <g key={i}>
          <rect x={c.x - B} y={c.y - B} width={c.w + 2 * B} height={c.h + 2 * B} fill={ACCENT} opacity="0.08" />
          <rect x={c.x} y={c.y} width={c.w} height={c.h} fill="#f7f4ec" stroke={LINE} strokeWidth="0.3" />
          {/* a card: title band, picture, a few lines */}
          <rect x={c.x + 6} y={c.y + 6} width={c.w * 0.42} height={5} fill={INK} />
          <rect x={c.x + 6} y={c.y + 15} width={c.w - 12} height={c.h * 0.42} fill="#e4dfd1" />
          {[0, 1, 2].map((k) => (
            <rect key={k} x={c.x + 6} y={c.y + 15 + c.h * 0.42 + 5 + k * 4.2} width={(c.w - 12) * (k === 2 ? 0.55 : 1)} height={1.6} fill="#cfc9b9" />
          ))}
          <text x={c.x + c.w - 6} y={c.y + c.h - 5} fontSize="3.2" fontFamily="var(--font-mono), monospace" textAnchor="end" fill="#9c9688">
            {String(i + 1).padStart(2, '0')}
          </text>
        </g>
      ))}

      {/* crop marks in the margins, at every cut */}
      <g stroke={INK} strokeWidth="0.35" strokeLinecap="butt">
        {xs.map((x) => (
          <g key={`x${x}`}>
            <line className="ps-mark" x1={x} y1={off} x2={x} y2={off + tick} />
            <line className="ps-mark" x1={x} y1={H - off} x2={x} y2={H - off - tick} />
          </g>
        ))}
        {ys.map((y) => (
          <g key={`y${y}`}>
            <line className="ps-mark" x1={off} y1={y} x2={off + tick} y2={y} />
            <line className="ps-mark" x1={W - off} y1={y} x2={W - off - tick} y2={y} />
          </g>
        ))}
      </g>

      {/* registration targets in the side margins */}
      {[[fit.marginXMm / 2, H / 2], [W - fit.marginRightMm / 2, H / 2]].map(([cx, cy], i) => (
        <g key={i} stroke={INK} strokeWidth="0.3" fill="none">
          <circle cx={cx} cy={cy} r="2.2" />
          <line x1={cx - 3.2} y1={cy} x2={cx + 3.2} y2={cy} />
          <line x1={cx} y1={cy - 3.2} x2={cx} y2={cy + 3.2} />
        </g>
      ))}

      {/* colour bar and slug line in the foot */}
      <g transform={`translate(${fit.marginXMm} ${H - fit.marginBottomMm / 2 - 2.2})`}>
        {BAR.map((c, i) => <rect key={i} x={i * 5.2} y="0" width="4.6" height="4.4" fill={c} />)}
      </g>
      <text x={W - fit.marginRightMm} y={H - fit.marginBottomMm / 2 + 1} fontSize="2.9" fontFamily="var(--font-mono), monospace" textAnchor="end" fill="#6f6a60" letterSpacing="0.2">
        {`IMPOSITIONPDF · LETTER · 2×4 · ${fit.cellWsMm[0]}×${fit.cellHMm} · BLEED ${B}`}
      </text>

      {/* the blade: one line, sweeping the cuts */}
      <line className="ps-blade" x1="0" y1={firstCut} x2={W} y2={firstCut} stroke={ACCENT} strokeWidth="0.5" opacity="0" />
    </svg>
  );
}
