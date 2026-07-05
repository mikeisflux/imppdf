// Competitor comparison data. Powers /compare and /compare/[slug] — SEO landing
// pages that rank for "<competitor> alternative" searches. Copy is factual and
// fair: it states what each tool is and where a free, browser-based, nothing-
// uploaded workflow differs. No disparagement — just an honest side-by-side.
import { siteName } from './config';

export interface CompareRow { feature: string; ours: boolean | string; theirs: boolean | string; }
export interface Competitor {
  slug: string;
  name: string;
  tagline: string;      // one line describing the competitor
  kind: string;         // e.g. "Desktop app", "Acrobat plugin", "RIP / workflow"
  intro: string;        // 2–3 sentences of context
  whySwitch: string[];  // bullet reasons to try us instead
  rows: CompareRow[];   // feature matrix (ours vs theirs)
}

// Shared feature rows most comparisons reuse; a competitor can override any.
function baseRows(overrides: Partial<Record<string, CompareRow['theirs']>> = {}): CompareRow[] {
  const rows: CompareRow[] = [
    { feature: 'Runs in the browser (no install)', ours: true, theirs: overrides['browser'] ?? false },
    { feature: 'Files stay on your device (nothing uploaded)', ours: true, theirs: overrides['local'] ?? 'N/A (desktop)' },
    { feature: 'Free to use', ours: true, theirs: overrides['free'] ?? false },
    { feature: 'Booklet & saddle-stitch', ours: true, theirs: overrides['booklet'] ?? true },
    { feature: 'Perfect-bound / trade paperback', ours: true, theirs: overrides['perfect'] ?? true },
    { feature: 'N-up & step-and-repeat', ours: true, theirs: overrides['nup'] ?? true },
    { feature: 'Gang sheets', ours: true, theirs: overrides['gang'] ?? true },
    { feature: 'Comic book imposition', ours: true, theirs: overrides['comic'] ?? 'Manual' },
    { feature: 'Crop, bleed & registration marks', ours: true, theirs: overrides['marks'] ?? true },
    { feature: 'Preflight checks', ours: true, theirs: overrides['preflight'] ?? true },
    { feature: 'Cross-platform (Win/Mac/Linux/ChromeOS)', ours: true, theirs: overrides['xplat'] ?? false },
  ];
  return rows;
}

export const COMPETITORS: Competitor[] = [
  {
    slug: 'imposition-wizard',
    name: 'Imposition Wizard',
    tagline: 'Standalone desktop imposition app for Windows and macOS.',
    kind: 'Desktop app',
    intro: `Imposition Wizard is a well-regarded standalone imposition application for Windows and macOS with a visual editor for N-up, booklets and step-and-repeat. ${siteName} covers the same core layouts, but in the browser with nothing to install and no files leaving your device.`,
    whySwitch: [
      'No download or license — open a tab and impose.',
      'Your PDFs are processed locally in the browser; they are never uploaded.',
      'Works on any OS with a modern browser, including Linux and ChromeOS.',
    ],
    rows: baseRows(),
  },
  {
    slug: 'quite-imposing',
    name: 'Quite Imposing',
    tagline: 'Acrobat plugin for imposition (Quite Imposing / Quite Imposing Plus).',
    kind: 'Acrobat plugin',
    intro: `Quite Imposing and Quite Imposing Plus are long-standing Adobe Acrobat plugins for booklets, N-up and step-and-repeat. They require a paid copy of Acrobat plus the plugin license. ${siteName} runs on its own in any browser — no Acrobat, no plugin, no install.`,
    whySwitch: [
      'No Acrobat required — runs by itself in the browser.',
      'Free, with no per-seat plugin license.',
      'Same booklet, N-up and step-and-repeat workflows, plus comics and trade paperbacks.',
    ],
    rows: baseRows({ local: 'Local (in Acrobat)' }),
  },
  {
    slug: 'montax-imposer',
    name: 'Montax Imposer',
    tagline: 'Acrobat plugin for template-based and variable-data imposition.',
    kind: 'Acrobat plugin',
    intro: `Montax Imposer is an Acrobat plugin focused on template-based and variable-data imposition. It needs Acrobat and a license. ${siteName} offers browser-based N-up, step-and-repeat and gang sheets with CSV variable data, without Acrobat.`,
    whySwitch: [
      'No Acrobat or plugin install.',
      'CSV variable-data and step-and-repeat in the browser.',
      'Free to use for everyday imposition.',
    ],
    rows: baseRows({ local: 'Local (in Acrobat)' }),
  },
  {
    slug: 'kodak-preps',
    name: 'Kodak Preps',
    tagline: 'Professional imposition software for commercial print production.',
    kind: 'Production software',
    intro: `Kodak Preps is powerful production imposition software used in commercial print shops, with deep signature and binding controls. It is a paid, installed product aimed at high-volume shops. ${siteName} is a free, browser-based tool for the common booklet, N-up, gang-sheet and card layouts — quick jobs without the production overhead.`,
    whySwitch: [
      'No install or license for quick, everyday jobs.',
      'Runs anywhere with a browser.',
      'Nothing uploaded — files stay local.',
    ],
    rows: baseRows({ free: false }),
  },
  {
    slug: 'pdfsam',
    name: 'PDFsam',
    tagline: 'Open-source PDF split & merge with basic N-up.',
    kind: 'Desktop app',
    intro: `PDFsam is a popular open-source desktop tool for splitting, merging and basic N-up. It is great for page operations but is not a dedicated imposition tool. ${siteName} adds print-focused imposition — booklets, step-and-repeat, gang sheets, marks and bleed — in the browser.`,
    whySwitch: [
      'Purpose-built for print imposition, not just split/merge.',
      'Crop, bleed and registration marks on every layout.',
      'No install — runs in the browser.',
    ],
    rows: baseRows({ free: true, browser: false, booklet: 'Basic', perfect: false, gang: false, comic: false, marks: false, preflight: false }),
  },
  {
    slug: 'callas-pdftoolbox',
    name: 'callas pdfToolbox',
    tagline: 'Prepress automation and preflight suite with imposition.',
    kind: 'Prepress suite',
    intro: `callas pdfToolbox is a comprehensive prepress automation and preflight suite with imposition among many features. It is a paid, installed product for production automation. ${siteName} focuses on fast, free, in-browser imposition with built-in preflight checks for the everyday jobs.`,
    whySwitch: [
      'Free and instant in the browser.',
      'Built-in preflight (fonts, bleed, DPI, colour, page count).',
      'No install or automation setup for one-off jobs.',
    ],
    rows: baseRows({ free: false }),
  },
];

export function findCompetitor(slug: string): Competitor | undefined {
  return COMPETITORS.find((c) => c.slug === slug);
}
