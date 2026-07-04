// Lightweight inline-SVG "preview" art for gallery tool cards. Chosen by slug
// with sensible per-category fallbacks so every tool has a distinctive thumbnail.
import type { ToolCategory } from '@/lib/tools';

const SHEET = { fill: '#f6f6f8', stroke: '#e2e2e8' };
const LINE = '#d8d8e0';
const ACCENT = '#7c5cff';

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 200 150" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      {children}
    </svg>
  );
}

function textLines(x: number, y: number, w: number, n: number, gap = 9) {
  return Array.from({ length: n }).map((_, i) => (
    <rect key={i} x={x} y={y + i * gap} width={i % 3 === 2 ? w * 0.6 : w} height={3.5} rx={1.75} fill={LINE} />
  ));
}

export function ToolMockup({ slug, category }: { slug: string; category: ToolCategory }) {
  switch (slug) {
    case 'booklet':
    case 'saddle-stitch-magazine':
    case 'perfect-bound-book':
    case 'graphic-novel':
    case 'comic':
    case 'n-up-book':
    case 'greeting-card':
    case 'menu':
      return (
        <Frame>
          <rect x="18" y="20" width="80" height="110" rx="4" fill={SHEET.fill} stroke={SHEET.stroke} />
          <rect x="102" y="20" width="80" height="110" rx="4" fill={SHEET.fill} stroke={SHEET.stroke} />
          <rect x="98" y="20" width="4" height="110" fill={ACCENT} opacity="0.5" />
          <rect x="30" y="34" width="46" height="8" rx="2" fill={ACCENT} opacity="0.6" />
          <rect x="30" y="52" width="56" height="30" rx="3" fill={LINE} />
          {textLines(30, 92, 56, 4)}
          <rect x="124" y="34" width="46" height="8" rx="2" fill={ACCENT} opacity="0.6" />
          <rect x="124" y="52" width="56" height="30" rx="3" fill={LINE} />
          {textLines(124, 92, 56, 4)}
        </Frame>
      );
    case 'expert-grid':
    case 'standard-sizes':
    case 'index-print':
    case 'gang-sheet':
    case 'optimal-fit':
      return (
        <Frame>
          <rect x="30" y="14" width="140" height="122" rx="5" fill={SHEET.fill} stroke={SHEET.stroke} />
          {Array.from({ length: 3 }).map((_, r) =>
            Array.from({ length: 4 }).map((_, c) => (
              <rect key={`${r}-${c}`} x={40 + c * 32} y={24 + r * 36} width={26} height={30} rx={3}
                fill="#ececf1" stroke="#dcdce4" />
            )),
          )}
        </Frame>
      );
    case 'cut-and-stack':
      return (
        <Frame>
          <rect x="40" y="16" width="120" height="118" rx="5" fill={SHEET.fill} stroke={SHEET.stroke} />
          <line x1="100" y1="24" x2="100" y2="126" stroke={ACCENT} strokeWidth="1.5" strokeDasharray="4 4" />
          {[0, 1, 2].map((r) => (
            <g key={r}>
              <rect x="54" y={30 + r * 32} width="34" height="24" rx="3" fill="#ececf1" stroke="#dcdce4" />
              <text x="71" y={46 + r * 32} fontSize="11" fill="#9a9aa5" textAnchor="middle">{r + 1}</text>
              <rect x="112" y={30 + r * 32} width="34" height="24" rx="3" fill="#ececf1" stroke="#dcdce4" />
              <text x="129" y={46 + r * 32} fontSize="11" fill="#9a9aa5" textAnchor="middle">{r + 4}</text>
            </g>
          ))}
        </Frame>
      );
    case 'business-cards':
    case 'stickers':
    case 'step-and-repeat':
      return (
        <Frame>
          <rect x="26" y="18" width="148" height="114" rx="5" fill={SHEET.fill} stroke={SHEET.stroke} />
          {[0, 1].map((r) =>
            [0, 1].map((c) => (
              <g key={`${r}-${c}`}>
                <rect x={40 + c * 66} y={30 + r * 52} width={52} height={38} rx={4} fill="#fff" stroke="#dcdce4" />
                <rect x={46 + c * 66} y={36 + r * 52} width={18} height={5} rx={2} fill={ACCENT} opacity="0.6" />
                <rect x={46 + c * 66} y={46 + r * 52} width={30} height={3} rx={1.5} fill={LINE} />
                <rect x={72 + c * 66} y={50 + r * 52} width={14} height={14} rx={2} fill="#2a2a30" />
              </g>
            )),
          )}
        </Frame>
      );
    case 'calendar':
      return (
        <Frame>
          <rect x="34" y="16" width="132" height="118" rx="5" fill={SHEET.fill} stroke={SHEET.stroke} />
          <rect x="34" y="16" width="132" height="20" rx="5" fill="#fff" />
          <text x="46" y="30" fontSize="9" fill={ACCENT} fontWeight="700">June 2026</text>
          {Array.from({ length: 4 }).map((_, r) =>
            Array.from({ length: 7 }).map((_, c) => {
              const active = r === 2 && c === 2;
              return (
                <rect key={`${r}-${c}`} x={40 + c * 18} y={44 + r * 20} width={14} height={16} rx={2}
                  fill={active ? ACCENT : '#ececf1'} stroke="#dcdce4" />
              );
            }),
          )}
        </Frame>
      );
    case 'tiled-poster':
      return (
        <Frame>
          <rect x="55" y="30" width="90" height="90" rx="3" fill="#f0eefb" stroke={ACCENT} strokeOpacity="0.5" strokeDasharray="4 3" />
          <line x1="100" y1="30" x2="100" y2="120" stroke={ACCENT} strokeWidth="1.2" strokeDasharray="3 3" />
          <line x1="55" y1="75" x2="145" y2="75" stroke={ACCENT} strokeWidth="1.2" strokeDasharray="3 3" />
        </Frame>
      );
    case 'packaging-dieline':
      return (
        <Frame>
          <g stroke={ACCENT} strokeOpacity="0.55" strokeDasharray="4 3" fill="#f2f0fb">
            <rect x="82" y="40" width="36" height="36" />
            <rect x="46" y="40" width="36" height="36" />
            <rect x="118" y="40" width="36" height="36" />
            <rect x="82" y="76" width="36" height="30" />
            <rect x="82" y="14" width="36" height="26" />
          </g>
        </Frame>
      );
    case 'trifold-brochure':
    case 'folded-brochure':
      return (
        <Frame>
          <rect x="24" y="24" width="152" height="102" rx="4" fill={SHEET.fill} stroke={SHEET.stroke} />
          <line x1="75" y1="24" x2="75" y2="126" stroke={LINE} />
          <line x1="125" y1="24" x2="125" y2="126" stroke={LINE} />
          <rect x="86" y="36" width="30" height="7" rx="2" fill={ACCENT} opacity="0.6" />
          {textLines(34, 40, 30, 4)}
          {textLines(135, 40, 30, 4)}
        </Frame>
      );
    case 'zine':
      return (
        <Frame>
          <rect x="66" y="22" width="68" height="106" rx="4" fill={ACCENT} />
          <text x="100" y="52" fontSize="10" fill="#fff" textAnchor="middle" fontFamily="monospace" letterSpacing="2">ZINE</text>
        </Frame>
      );
    case 'bleed-crop-marks':
      return (
        <Frame>
          <rect x="40" y="24" width="120" height="102" rx="3" fill={SHEET.fill} stroke={SHEET.stroke} />
          {[[40, 24], [160, 24], [40, 126], [160, 126]].map(([x, y], i) => (
            <g key={i} stroke="#2a2a30" strokeWidth="1">
              <line x1={x - 8} y1={y} x2={x + 8} y2={y} />
              <line x1={x} y1={y - 8} x2={x} y2={y + 8} />
            </g>
          ))}
          {textLines(56, 44, 88, 6)}
        </Frame>
      );
    case 'cutter-marks':
    case 'registration-marks':
      return (
        <Frame>
          <rect x="48" y="30" width="104" height="90" rx="3" fill={SHEET.fill} stroke={SHEET.stroke} />
          <line x1="100" y1="20" x2="100" y2="130" stroke={ACCENT} strokeWidth="1" strokeDasharray="4 3" />
          <line x1="40" y1="75" x2="160" y2="75" stroke={ACCENT} strokeWidth="1" strokeDasharray="4 3" />
          {[[100, 22], [100, 128], [42, 75], [158, 75]].map(([x, y], i) => (
            <g key={i}><circle cx={x} cy={y} r="5" fill="#1a1a2e" /><circle cx={x} cy={y} r="2" fill="#fff" /></g>
          ))}
        </Frame>
      );
    case 'color-bar-header':
    case 'color-management':
      return (
        <Frame>
          <rect x="46" y="20" width="108" height="110" rx="4" fill={SHEET.fill} stroke={SHEET.stroke} />
          {textLines(58, 36, 70, 7)}
          <g>
            {['#22d3ee', '#f472b6', '#facc15', '#1a1a1a'].map((c, i) => (
              <rect key={i} x={110 + i * 11} y={112} width={10} height={10} fill={c} />
            ))}
          </g>
        </Frame>
      );
    case 'preflight':
      return (
        <Frame>
          <rect x="34" y="18" width="132" height="114" rx="5" fill={SHEET.fill} stroke={SHEET.stroke} />
          <text x="46" y="36" fontSize="8" fontFamily="monospace" fill="#2a2a30" fontWeight="700">PREFLIGHT REPORT</text>
          <rect x="120" y="28" width="38" height="12" rx="6" fill="#fde68a" />
          {['Resolution', 'Color space', 'Bleed', 'Fonts', 'Overprint'].map((t, i) => (
            <g key={t}>
              <circle cx="50" cy={54 + i * 15} r="3.5" fill={i === 2 ? '#f59e0b' : '#cbd5e1'} />
              <text x="60" y={57 + i * 15} fontSize="7.5" fill="#6d6d7a" fontFamily="monospace">{t}</text>
            </g>
          ))}
        </Frame>
      );
    case 'variable-data':
    case 'barcode-qr':
      return (
        <Frame>
          <rect x="60" y="30" width="90" height="54" rx="4" fill="#fff" stroke={SHEET.stroke} transform="rotate(6 100 55)" />
          <rect x="50" y="52" width="100" height="60" rx="4" fill="#fff" stroke={SHEET.stroke} />
          <text x="60" y="70" fontSize="8" fontFamily="monospace" fill="#2a2a30" letterSpacing="1">ADMIT ONE</text>
          <text x="132" y="70" fontSize="8" fontFamily="monospace" fill="#2a2a30">#00480</text>
          {Array.from({ length: 22 }).map((_, i) => (
            <rect key={i} x={60 + i * 3.6} y={84} width={i % 3 ? 1.6 : 2.6} height={18} fill="#1a1a1a" />
          ))}
        </Frame>
      );
    case 'page-numbering':
      return (
        <Frame>
          <rect x="60" y="30" width="80" height="60" rx="3" fill="#fff" stroke={SHEET.stroke} transform="rotate(-6 100 60)" />
          <rect x="55" y="45" width="85" height="70" rx="3" fill={SHEET.fill} stroke={SHEET.stroke} />
          {textLines(66, 58, 62, 5)}
          <circle cx="128" cy="104" r="8" fill={ACCENT} opacity="0.15" />
          <text x="128" y="107" fontSize="8" fill={ACCENT} textAnchor="middle" fontWeight="700">12</text>
        </Frame>
      );
    case 'watermark':
    case 'backdrop':
      return (
        <Frame>
          <rect x="46" y="20" width="108" height="110" rx="4" fill={SHEET.fill} stroke={SHEET.stroke} />
          <text x="100" y="80" fontSize="18" fill={ACCENT} opacity="0.25" textAnchor="middle" transform="rotate(-24 100 75)" fontWeight="800">DRAFT</text>
          {textLines(58, 34, 84, 8)}
        </Frame>
      );
    // Page & PDF tools -------------------------------------------------------
    case 'rotate':
      return (
        <Frame>
          <rect x="72" y="42" width="56" height="70" rx="4" fill={SHEET.fill} stroke={SHEET.stroke} transform="rotate(18 100 75)" />
          <circle cx="100" cy="78" r="42" fill="none" stroke={LINE} strokeDasharray="3 4" />
          <circle cx="118" cy="46" r="3" fill={ACCENT} />
        </Frame>
      );
    case 'crop':
      return (
        <Frame>
          <rect x="50" y="30" width="100" height="90" rx="2" fill={SHEET.fill} stroke={SHEET.stroke} />
          <rect x="66" y="44" width="68" height="62" fill="none" stroke={ACCENT} strokeWidth="1.4" strokeDasharray="4 3" />
          {[[66, 44], [134, 44], [66, 106], [134, 106]].map(([x, y], i) => (
            <rect key={i} x={x - 3} y={y - 3} width="6" height="6" fill={ACCENT} />
          ))}
        </Frame>
      );
    case 'split':
      return (
        <Frame>
          <rect x="52" y="26" width="96" height="98" rx="4" fill={SHEET.fill} stroke={SHEET.stroke} />
          <line x1="100" y1="20" x2="100" y2="130" stroke={ACCENT} strokeWidth="1.3" strokeDasharray="5 4" />
        </Frame>
      );
    case 'flip':
      return (
        <Frame>
          <rect x="56" y="30" width="88" height="90" rx="4" fill={SHEET.fill} stroke={SHEET.stroke} />
          <line x1="100" y1="24" x2="100" y2="126" stroke={LINE} strokeDasharray="4 4" />
          <path d="M92 66 L108 75 L92 84 Z" fill={LINE} />
        </Frame>
      );
    case 'merge':
      return (
        <Frame>
          <rect x="56" y="26" width="74" height="92" rx="4" fill="#fff" stroke={SHEET.stroke} transform="rotate(-8 90 70)" />
          <rect x="66" y="30" width="74" height="92" rx="4" fill="#fff" stroke={SHEET.stroke} transform="rotate(4 100 76)" />
          <rect x="74" y="34" width="74" height="92" rx="4" fill={SHEET.fill} stroke={SHEET.stroke} />
        </Frame>
      );
    case 'overlay':
      return (
        <Frame>
          <rect x="52" y="34" width="76" height="82" rx="4" fill={SHEET.fill} stroke={SHEET.stroke} />
          <rect x="82" y="26" width="66" height="72" rx="4" fill="#fff" fillOpacity="0.7" stroke={ACCENT} strokeOpacity="0.4" />
        </Frame>
      );
    case 'shuffle':
      return (
        <Frame>
          <rect x="34" y="20" width="132" height="110" rx="5" fill={SHEET.fill} stroke={SHEET.stroke} />
          {[1, 2, 3, 4].map((n, i) => (
            <g key={n}>
              <rect x={48 + i * 27} y="60" width="22" height="26" rx="3" fill="#ececf1" stroke="#dcdce4" />
              <text x={59 + i * 27} y="77" fontSize="11" fill="#9a9aa5" textAnchor="middle">{n}</text>
            </g>
          ))}
          <text x="100" y="104" fontSize="8" fill={ACCENT} textAnchor="middle" fontFamily="monospace" letterSpacing="2">SHUFFLE</text>
        </Frame>
      );
    case 'nudge':
      return (
        <Frame>
          <rect x="40" y="20" width="120" height="110" rx="5" fill={SHEET.fill} stroke={SHEET.stroke} />
          <rect x="86" y="62" width="28" height="26" rx="3" fill="#c9c9d2" />
          <g fill={ACCENT}>
            <path d="M100 34 l6 8 h-12 z" /><path d="M100 116 l6 -8 h-12 z" />
            <path d="M52 75 l8 6 v-12 z" /><path d="M148 75 l-8 6 v-12 z" />
          </g>
        </Frame>
      );
    case 'layers':
      return (
        <Frame>
          <rect x="40" y="24" width="120" height="102" rx="5" fill={SHEET.fill} stroke={SHEET.stroke} />
          <text x="52" y="42" fontSize="8" fontFamily="monospace" fill="#2a2a30" fontWeight="700">LAYERS</text>
          {[true, false, true, false].map((on, i) => (
            <g key={i}>
              <rect x="52" y={52 + i * 16} width="18" height="10" rx="5" fill={on ? ACCENT : '#d8d8e0'} />
              <circle cx={on ? 65 : 57} cy={57 + i * 16} r="4" fill="#fff" />
              <rect x="78" y={54 + i * 16} width="70" height="6" rx="3" fill={LINE} />
            </g>
          ))}
        </Frame>
      );
    case 'jdf-export':
      return (
        <Frame>
          <rect x="46" y="18" width="108" height="114" rx="5" fill={SHEET.fill} stroke={SHEET.stroke} />
          <text x="56" y="34" fontSize="8" fontFamily="monospace" fill={ACCENT} fontWeight="700">JDF</text>
          <text x="150" y="34" fontSize="7" fontFamily="monospace" fill="#9a9aa5" textAnchor="end">job-0480.jdf</text>
          {['Quantity', 'Stock', 'Trim size', 'Sides', 'Binding', 'Bleed'].map((t, i) => (
            <text key={t} x="56" y={52 + i * 13} fontSize="7" fontFamily="monospace" fill="#6d6d7a">{t}</text>
          ))}
        </Frame>
      );
    case 'batch':
      return (
        <Frame>
          <rect x="40" y="22" width="120" height="106" rx="5" fill={SHEET.fill} stroke={SHEET.stroke} />
          <text x="52" y="40" fontSize="7.5" fontFamily="monospace" fill="#2a2a30" fontWeight="700">BATCH · 4 FILES</text>
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              <rect x="52" y={50 + i * 16} width="10" height="10" rx="2" fill="#e2e2e8" />
              <rect x="68" y={53 + i * 16} width={i === 3 ? 40 : 78} height="4" rx="2" fill={i < 2 ? ACCENT : LINE} />
            </g>
          ))}
        </Frame>
      );
    case 'page-preview':
      return (
        <Frame>
          <rect x="34" y="20" width="132" height="110" rx="5" fill={SHEET.fill} stroke={SHEET.stroke} />
          {[0, 1, 2].map((i) => (
            <rect key={i} x="44" y={30 + i * 26} width="22" height="22" rx="3"
              fill={i === 1 ? '#fff' : '#ececf1'} stroke={i === 1 ? ACCENT : '#dcdce4'} strokeWidth={i === 1 ? 1.6 : 1} />
          ))}
          <rect x="78" y="34" width="76" height="90" rx="3" fill="#fff" stroke={SHEET.stroke} />
          <rect x="132" y="112" width="18" height="8" rx="2" fill={ACCENT} opacity="0.2" />
        </Frame>
      );
    default:
      // Category-aware fallback so the many preset tools still read distinctly.
      if (category === 'make') {
        // Ganged product sheet.
        return (
          <Frame>
            <rect x="30" y="18" width="140" height="114" rx="5" fill={SHEET.fill} stroke={SHEET.stroke} />
            {[0, 1].map((r) =>
              [0, 1, 2].map((c) => (
                <rect key={`${r}-${c}`} x={42 + c * 42} y={30 + r * 52} width={34} height={40} rx={3} fill="#fff" stroke="#dcdce4" />
              )),
            )}
          </Frame>
        );
      }
      if (category === 'marks') {
        return (
          <Frame>
            <rect x="46" y="20" width="108" height="110" rx="4" fill={SHEET.fill} stroke={SHEET.stroke} />
            {[[46, 20], [154, 20], [46, 130], [154, 130]].map(([x, y], i) => (
              <g key={i} stroke="#2a2a30" strokeWidth="1">
                <line x1={x - 7} y1={y} x2={x + 7} y2={y} /><line x1={x} y1={y - 7} x2={x} y2={y + 7} />
              </g>
            ))}
            {textLines(58, 36, 84, 6)}
            <rect x="58" y="112" width="30" height="8" rx="2" fill={ACCENT} opacity="0.4" />
          </Frame>
        );
      }
      // imposition / pages / advanced — a clean sheet with a header band.
      return (
        <Frame>
          <rect x="52" y="20" width="96" height="110" rx="5" fill={SHEET.fill} stroke={SHEET.stroke} />
          <rect x="64" y="34" width="40" height="7" rx="2" fill={ACCENT} opacity="0.5" />
          {textLines(64, 52, 72, 7)}
        </Frame>
      );
  }
}
