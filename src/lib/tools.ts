// ─────────────────────────────────────────────────────────────────────────────
// Central tool catalog. This is the single source of truth for every tool the
// site advertises — homepage gallery, footer mega-menu, and /tools/<slug>
// landing pages all render from here.
//
// `inPlugin` marks whether the CURRENTLY bundled imposition-toolkit exposes the
// tool. Tools flagged false are advertised now and light up automatically when
// the new, more complete plugin version is dropped into src/lib/imposition-toolkit.
// `engine` is the deep-link key passed to the app (?tool=<engine>) so the plugin
// can open straight to that tool.
// ─────────────────────────────────────────────────────────────────────────────

export type ToolCategory =
  | 'imposition'
  | 'make'
  | 'marks'
  | 'pages'
  | 'advanced';

export interface Tool {
  slug: string;
  name: string;
  blurb: string;
  category: ToolCategory;
  /** engine/tool key the plugin opens to (app ?tool=) */
  engine: string;
  /** whether the current bundled plugin supports it */
  inPlugin: boolean;
  /** short call-to-action label used on gallery cards */
  cta?: string;
}

export const CATEGORY_LABEL: Record<ToolCategory, string> = {
  imposition: 'Imposition & layout',
  make: 'What you can make',
  marks: 'Marks, color & prepress',
  pages: 'Page & PDF tools',
  advanced: 'Advanced',
};

export const TOOLS: Tool[] = [
  // ── Imposition & layout ────────────────────────────────────────────────────
  { slug: 'standard-sizes', name: 'Standard Sizes', blurb: '19 presets: Letter, A4, SRA3 and more.', category: 'imposition', engine: 'nup', inPlugin: true, cta: 'Start imposing' },
  { slug: 'n-up-book', name: 'N-up Book', blurb: 'Booklet pages, imposed automatically.', category: 'imposition', engine: 'booklet', inPlugin: true, cta: 'Build n-up book' },
  { slug: 'cut-and-stack', name: 'Cut & Stack', blurb: 'Sequential numbers across cut stacks.', category: 'imposition', engine: 'nup', inPlugin: true, cta: 'Cut & stack' },
  { slug: 'expert-grid', name: 'Expert Grid', blurb: 'Full control over rows, gutters and margins.', category: 'imposition', engine: 'nup', inPlugin: true, cta: 'Open expert grid' },
  { slug: 'optimal-fit', name: 'Optimal Fit', blurb: 'Pack the most pages per sheet.', category: 'imposition', engine: 'nup', inPlugin: true, cta: 'Auto-fit pages' },
  { slug: 'step-and-repeat', name: 'Step & Repeat', blurb: 'One design, repeated across the sheet.', category: 'imposition', engine: 'nup', inPlugin: true, cta: 'Step & repeat' },
  { slug: 'gang-sheet', name: 'Gang Sheet', blurb: 'Many jobs on one press sheet.', category: 'imposition', engine: 'nup', inPlugin: true, cta: 'Build gang sheet' },
  { slug: 'index-print', name: 'Index Print', blurb: 'A contact sheet of every page.', category: 'imposition', engine: 'nup', inPlugin: true, cta: 'Make an index' },
  { slug: 'booklet', name: 'Booklet', blurb: 'Saddle-stitch & perfect-bound spreads.', category: 'imposition', engine: 'booklet', inPlugin: true, cta: 'Make a booklet' },

  // ── What you can make ──────────────────────────────────────────────────────
  { slug: 'business-cards', name: 'Business Cards', blurb: 'Gang multiple cards per sheet.', category: 'make', engine: 'nup', inPlugin: true, cta: 'Impose cards' },
  { slug: 'saddle-stitch-magazine', name: 'Saddle-Stitch Magazine', blurb: 'Stapled magazines & booklets.', category: 'make', engine: 'booklet', inPlugin: true, cta: 'Make a magazine' },
  { slug: 'perfect-bound-book', name: 'Perfect-Bound Book', blurb: 'Squared-spine books & catalogs.', category: 'make', engine: 'booklet', inPlugin: true, cta: 'Make a book' },
  { slug: 'zine', name: 'Zine', blurb: '8-page zine from a single sheet.', category: 'make', engine: 'booklet', inPlugin: true, cta: 'Make a zine' },
  { slug: 'trifold-brochure', name: 'Trifold Brochure', blurb: 'Roll-fold & gate-fold leaflets.', category: 'make', engine: 'nup', inPlugin: true, cta: 'Make a brochure' },
  { slug: 'folded-brochure', name: 'Folded Brochure', blurb: 'Roll-fold, Z-fold & gate-fold.', category: 'make', engine: 'nup', inPlugin: true, cta: 'Fold a brochure' },
  { slug: 'tiled-poster', name: 'Tiled Poster', blurb: 'Big posters from small sheets.', category: 'make', engine: 'poster', inPlugin: true, cta: 'Tile a poster' },
  { slug: 'stickers', name: 'Stickers', blurb: 'Die-cut sticker sheets, ganged up.', category: 'make', engine: 'nup', inPlugin: true, cta: 'Make stickers' },
  { slug: 'calendar', name: 'Calendar', blurb: 'Build print-ready calendar layouts.', category: 'make', engine: 'nup', inPlugin: true, cta: 'Make a calendar' },
  { slug: 'packaging-dieline', name: 'Packaging Dieline', blurb: 'Boxes, cartons & custom shapes.', category: 'make', engine: 'dieline', inPlugin: true, cta: 'Add a dieline' },

  // ── Marks, color & prepress ────────────────────────────────────────────────
  { slug: 'bleed-crop-marks', name: 'Bleed & Crop Marks', blurb: 'Print edge-to-edge with confidence.', category: 'marks', engine: 'bleed', inPlugin: true, cta: 'Add marks' },
  { slug: 'cutter-marks', name: 'Cutter Marks', blurb: 'Registration & cutter guides on every tile.', category: 'marks', engine: 'cropmarks', inPlugin: true, cta: 'Add cutter marks' },
  { slug: 'color-bar-header', name: 'Color Bar & Header', blurb: 'Running headers, footers and control strips.', category: 'marks', engine: 'colorbar', inPlugin: true, cta: 'Add header & bar' },
  { slug: 'page-numbering', name: 'Page Numbering & Bates', blurb: 'Sequential & Bates stamps on every page.', category: 'marks', engine: 'pagenumbers', inPlugin: true, cta: 'Number pages' },
  { slug: 'preflight', name: 'Preflight Inspector', blurb: 'Catch print problems before output.', category: 'marks', engine: 'preflight', inPlugin: true, cta: 'Run preflight' },
  { slug: 'variable-data', name: 'Variable Data Printing', blurb: 'Serialize tickets, vouchers, badges and labels.', category: 'marks', engine: 'datamerge', inPlugin: true, cta: 'Open VDP wizard' },
  { slug: 'watermark', name: 'Watermark', blurb: 'Stamp a text or image watermark.', category: 'marks', engine: 'watermark', inPlugin: true, cta: 'Add watermark' },
  { slug: 'collating-marks', name: 'Collating Marks', blurb: 'Spine collation marks for gathering.', category: 'marks', engine: 'collating', inPlugin: true, cta: 'Add collating marks' },
  { slug: 'registration-marks', name: 'Registration Marks', blurb: 'Press registration targets on every sheet.', category: 'marks', engine: 'registration', inPlugin: false, cta: 'Add registration' },
  { slug: 'barcode-qr', name: 'Barcode / QR', blurb: 'Add scannable barcodes and QR codes.', category: 'marks', engine: 'barcode', inPlugin: false, cta: 'Add a barcode' },
  { slug: 'color-management', name: 'Color Management', blurb: 'RGB→CMYK conversion with ICC profiles.', category: 'marks', engine: 'color', inPlugin: false, cta: 'Convert color' },
  { slug: 'white-varnish', name: 'White / Varnish', blurb: 'Spot white and varnish separation layers.', category: 'marks', engine: 'varnish', inPlugin: false, cta: 'Add a spot layer' },
  { slug: 'braille', name: 'Braille', blurb: 'Add compliant braille to packaging.', category: 'marks', engine: 'braille', inPlugin: false, cta: 'Add braille' },
  { slug: 'dimensions', name: 'Dimensions', blurb: 'Dimension lines and measurement callouts.', category: 'marks', engine: 'dimensions', inPlugin: false, cta: 'Add dimensions' },
  { slug: 'backdrop', name: 'Backdrop', blurb: 'Place a background behind every page.', category: 'marks', engine: 'backdrop', inPlugin: false, cta: 'Add a backdrop' },

  // ── Page & PDF tools ───────────────────────────────────────────────────────
  { slug: 'rotate', name: 'Rotate', blurb: 'Spin pages to the right angle.', category: 'pages', engine: 'rotate', inPlugin: true, cta: 'Rotate pages' },
  { slug: 'crop', name: 'Crop', blurb: 'Trim pages to the area you need.', category: 'pages', engine: 'crop', inPlugin: true, cta: 'Crop pages' },
  { slug: 'split', name: 'Split PDF', blurb: 'Break one PDF into many.', category: 'pages', engine: 'split', inPlugin: true, cta: 'Split a PDF' },
  { slug: 'flip', name: 'Flip', blurb: 'Mirror pages horizontally or vertically.', category: 'pages', engine: 'flip', inPlugin: true, cta: 'Flip pages' },
  { slug: 'merge', name: 'Merge PDFs', blurb: 'Combine files into one document.', category: 'pages', engine: 'merge', inPlugin: true, cta: 'Merge PDFs' },
  { slug: 'overlay', name: 'Overlay', blurb: 'Stamp one PDF on top of another.', category: 'pages', engine: 'overlay', inPlugin: true, cta: 'Overlay PDFs' },
  { slug: 'shuffle', name: 'Shuffle', blurb: 'Reorder, reverse and repeat pages.', category: 'pages', engine: 'shuffle', inPlugin: true, cta: 'Shuffle pages' },
  { slug: 'resize', name: 'Resize', blurb: 'Scale pages to a new size.', category: 'pages', engine: 'resize', inPlugin: false, cta: 'Resize pages' },
  { slug: 'nudge', name: 'Nudge', blurb: 'Fine-tune page position.', category: 'pages', engine: 'nudge', inPlugin: false, cta: 'Nudge pages' },
  { slug: 'insert-pages', name: 'Insert Pages', blurb: 'Insert blanks or pages into a PDF.', category: 'pages', engine: 'insert', inPlugin: false, cta: 'Insert pages' },
  { slug: 'mix', name: 'Mix', blurb: 'Interleave pages from two PDFs.', category: 'pages', engine: 'mix', inPlugin: false, cta: 'Mix PDFs' },
  { slug: 'edit-pdf', name: 'Edit PDF', blurb: 'Reorder, delete and duplicate pages.', category: 'pages', engine: 'edit', inPlugin: false, cta: 'Edit a PDF' },
  { slug: 'header-footer', name: 'Header or Footer', blurb: 'Add running headers and footers.', category: 'pages', engine: 'headerfooter', inPlugin: true, cta: 'Add header/footer' },

  // ── Advanced ───────────────────────────────────────────────────────────────
  { slug: 'custom-impose', name: 'Custom Impose', blurb: 'Build a bespoke imposition pipeline.', category: 'advanced', engine: 'custom', inPlugin: true, cta: 'Open custom impose' },
  { slug: 'layers', name: 'Layers', blurb: 'Toggle and flatten PDF layers.', category: 'advanced', engine: 'layers', inPlugin: false, cta: 'Manage layers' },
  { slug: 'pdf-repair', name: 'PDF Repair', blurb: 'Rebuild and recover damaged PDFs.', category: 'advanced', engine: 'repair', inPlugin: false, cta: 'Repair a PDF' },
  { slug: 'compress', name: 'Compress PDF', blurb: 'Linearize and shrink file size.', category: 'advanced', engine: 'compress', inPlugin: false, cta: 'Compress a PDF' },
  { slug: 'jdf-export', name: 'JDF / CIP4 Export', blurb: 'Hand off a job ticket to your workflow.', category: 'advanced', engine: 'jdf', inPlugin: false, cta: 'Export JDF' },
  { slug: 'batch', name: 'Batch Processing', blurb: 'Run the same recipe over many files.', category: 'advanced', engine: 'batch', inPlugin: false, cta: 'Open a document' },
  { slug: 'page-preview', name: 'Page Preview', blurb: 'See every imposed sheet before you print.', category: 'advanced', engine: 'preview', inPlugin: true, cta: 'Open a document' },
];

export function toolsByCategory(cat: ToolCategory): Tool[] {
  return TOOLS.filter((t) => t.category === cat);
}

export function findTool(slug: string): Tool | undefined {
  return TOOLS.find((t) => t.slug === slug);
}

// Layout chips shown in the hero "or start with a layout" strip.
export const HERO_LAYOUT_CHIPS = [
  'Books', 'Brochures', 'Magazines', 'Newspapers', 'Zine', 'Cards', 'Postcards',
  'Stickers', 'Calendar', 'Posters', 'Flyers', 'Photo Prints', 'Banners',
  'Packaging', 'Cutter Marks', 'Custom Impose', 'Folding Brochure', 'Watermark',
  'Color Convert', 'Merge PDF', 'Split PDF', 'Compress PDF', 'Repair PDF',
];

// Audience cards ("Built for every print job").
export const USE_CASES = [
  { icon: '🖨️', title: 'Print shops & copy centers', blurb: 'Impose booklets, N-up sheets and gang runs for any digital or offset press, with crop marks and creep handled automatically.', link: 'Imposition software', href: '/tools/standard-sizes' },
  { icon: '🎟️', title: 'Event & venue organizers', blurb: 'Print numbered, QR-coded tickets, passes and wristbands straight from a spreadsheet with variable data printing.', link: 'Ticket printing', href: '/tools/variable-data' },
  { icon: '🧾', title: 'Label & sticker printers', blurb: 'Step-and-repeat one label across the whole sheet with exact gaps and cut marks, ready to die-cut.', link: 'Step & repeat', href: '/tools/step-and-repeat' },
  { icon: '🎨', title: 'Design & marketing studios', blurb: 'Gang business cards, flyers and brochures many-up on a single sheet, trimmed clean and ready for the press.', link: 'Card imposition', href: '/tools/business-cards' },
  { icon: '🎓', title: 'Schools, churches & clubs', blurb: 'Turn programs, newsletters and orders of service into saddle-stitch booklets that fold and staple in the right order.', link: 'Booklet imposition', href: '/tools/booklet' },
  { icon: '📖', title: 'Zine & indie publishers', blurb: 'Fold an 8-page mini-zine from a single sheet. The pages reorder themselves, so one print, one fold and one cut is all it takes.', link: 'Make a zine', href: '/tools/zine' },
];

// "Why print pros choose PDF Press" feature cards.
export const WHY_CARDS = [
  { icon: '🖨️', title: 'Real imposition, not PDF editing', blurb: "Saddle-stitch and perfect-bound booklets, n-up, step and repeat, cut and stack and gang sheets: the print layouts generic PDF tools can't do." },
  { icon: '🔒', title: 'Private by design', blurb: 'Files never leave your device. Every page is imposed locally in your browser, with nothing uploaded to a server.' },
  { icon: '🗔', title: 'No install, any browser', blurb: 'Open it on Mac, Windows, Linux or ChromeOS and start imposing instantly. No downloads, no plug-ins, no account required.' },
  { icon: '✂️', title: 'Print-ready in one click', blurb: 'Add bleed, crop, cut and registration marks automatically, so every job trims clean and goes straight to press.' },
  { icon: '🎨', title: 'Accurate CMYK color', blurb: 'Convert RGB to CMYK with real ICC profiles, soft-proofing and gamut warnings, so what you proof is what prints.' },
  { icon: '📐', title: 'Every standard size', blurb: '19 presets including Letter, A4, Tabloid, SRA3 and business cards, or enter any custom sheet size.' },
];

// FAQ (homepage accordion).
export const FAQ = [
  { q: 'What is PDF imposition?', a: 'Imposition is arranging a document’s individual pages onto a larger press sheet in the exact order and position a printer needs, so that after printing, folding and cutting, the pages end up in the right sequence.' },
  { q: 'Is PDF Press an imposition program?', a: 'Yes. PDF Press is browser-based imposition software: booklets, N-up, step-and-repeat, cut-and-stack, gang sheets, dielines and prepress marks — all running locally in your browser.' },
  { q: 'What does it mean to impose a PDF?', a: 'To impose a PDF is to place its pages onto a press sheet with the correct rotation, order, margins, gutters and marks so the printed sheet folds and trims into a finished product.' },
  { q: 'How do I impose a PDF?', a: 'Open PDF Press, drop in your PDF, pick a layout (booklet, N-up, step & repeat…), set the sheet size, margins, bleed and marks, preview the result and export a print-ready PDF.' },
  { q: 'Can I impose a PDF online for free?', a: 'Yes. The free tier lets you use every tool in the browser. Pro removes download cooldowns for unlimited output.' },
  { q: "What's the difference between imposition and prepress?", a: 'Prepress is everything that prepares a file for printing — color conversion, preflight, marks, trapping. Imposition is the specific prepress step of laying pages out on the press sheet.' },
  { q: 'What is a printing signature?', a: 'A signature is a single sheet printed with multiple pages that, once folded, forms a section of a book — commonly 4, 8, 16 or 32 pages.' },
  { q: 'What is the best free imposition software?', a: 'PDF Press is a strong free, browser-based option: no install, no per-seat license, and files never leave your device.' },
  { q: 'What is step-and-repeat printing?', a: 'Step-and-repeat places one design many times across a sheet with precise spacing and cut marks — ideal for business cards, labels and stickers.' },
  { q: 'Is PDF Press a good Fiery Impose or Quite Imposing alternative?', a: 'Yes. PDF Press does booklets, N-up and step-and-repeat in the browser without the per-seat license cost of desktop imposers.' },
  { q: 'How do I add bleed and crop marks to a PDF?', a: 'Use the Bleed & Crop Marks tool: set your bleed amount and mark length, and PDF Press adds trim, bleed and crop marks around every page.' },
  { q: 'How do I put multiple PDF pages on one sheet (N-up)?', a: 'Use the N-up / Grid tool: choose rows and columns, sheet size, gutters and margins, and PDF Press arranges the pages onto each sheet.' },
  { q: 'How do I make a booklet from a PDF?', a: 'Use the Booklet tool. It reorders pages into saddle-stitch or perfect-bound signatures with automatic creep compensation.' },
  { q: 'How do I impose business cards for printing?', a: 'Use Business Cards / Step & Repeat: set the card size and bleed, and gang many cards per sheet with cut marks.' },
  { q: 'Does PDF Press do variable data printing (VDP)?', a: 'Yes. Upload a CSV and PDF Press serializes tickets, vouchers, badges and labels — including a scannable QR code per record.' },
  { q: 'What is cut-and-stack imposition?', a: 'Cut-and-stack lays out sequential numbers so that after printing, cutting and stacking, each stack is in consecutive order — used for numbered tickets and cards.' },
  { q: 'What is the Expert grid for?', a: 'The Expert Grid gives full manual control over rows, columns, gutters, margins and per-cell placement for bespoke impositions.' },
  { q: 'Can I run preflight checks on my PDF?', a: 'Yes. The Preflight Inspector checks resolution, color space, bleed, fonts, overprint and minimum line width before output.' },
  { q: 'Does PDF Press export JDF or cut files?', a: 'JDF / CIP4 export hands a job ticket off to your MIS or cutter workflow (rolling out in the upcoming release).' },
  { q: 'Can I impose a PDF without Adobe Acrobat or InDesign?', a: 'Yes — PDF Press runs entirely in your browser, no Adobe software required.' },
  { q: 'How many pages should a booklet PDF have?', a: 'Saddle-stitch booklets need a page count divisible by 4. PDF Press pads with blanks automatically if needed.' },
  { q: 'Who is PDF Press for?', a: 'Print shops, copy centers, designers, prepress operators, publishers, packaging and label printers — anyone preparing files for print.' },
  { q: 'How does the browser-based tool work?', a: 'PDF Press reads your file with the browser File API, imposes it in memory with pdf-lib, and hands back a downloadable PDF — nothing is uploaded.' },
  { q: 'Is my file uploaded anywhere?', a: 'No. All processing is local to your browser. There is no server component that touches your document contents.' },
  { q: 'What file types and sizes are supported?', a: 'PDF is the primary input; images and CSV are supported for photo layouts and variable data. Large files are handled in-browser subject to your device memory.' },
  { q: 'Do I need Adobe Acrobat or any install?', a: 'No install of any kind. PDF Press works in any modern browser on any operating system.' },
];

// Guides (homepage "Popular imposition & prepress guides").
export const GUIDES = [
  { title: 'Prepress signature planning', blurb: 'Choose 4, 8, 16 or 32-page signatures and lay out books that fold and bind correctly.' },
  { title: 'N-up printing guide', blurb: 'Place 2, 4 or 8 pages on a single sheet to save paper, with predictable spacing and marks.' },
  { title: 'Free imposition software', blurb: 'Compare the best free, online imposition tools for booklets, N-up layouts and prepress.' },
  { title: 'Best imposition software 2026', blurb: 'See how the top imposition tools compare for print shops and digital printing.' },
  { title: 'Fix Acrobat booklet printing', blurb: 'Solve upside-down pages, wrong page order and duplex problems when printing booklets.' },
  { title: 'Fiery Impose alternative', blurb: 'Do booklets, N-up and step-and-repeat in your browser, without the per-seat license cost.' },
];

// Reviews (homepage testimonials).
export const REVIEWS = [
  { stars: 5, body: "We ran Quite Imposing on Acrobat for years. PDF Press does the same booklet and N-up impositions right in the browser, with no plug-in and no per-seat licence, and it's genuinely quicker to set up.", name: 'David Brennan', role: 'Prepress lead, commercial printer' },
  { stars: 4, body: 'I print zines on a Risograph and the imposition was always the painful part. PDF Press lays out my zine pages for saddle-stitch booklet printing in seconds, page order, creep and all.', name: 'Sofia Marchetti', role: 'Zine maker & illustrator' },
  { stars: 5, body: "I'd tried Imposition Wizard and Montax before this. PDF Press wins on speed. Open a tab, drop the PDF, and crop marks and bleed are already where I need them.", name: 'Aisha Rahman', role: 'Freelance packaging designer' },
  { stars: 5, body: "Best browser tool I've found for booklet printing. Saddle-stitch, perfect-bound signatures, automatic page imposition, and our zine and catalogue clients love the turnaround.", name: 'Yuki Tanaka', role: 'Print & bindery lead' },
  { stars: 5, body: "Imposing a saddle-stitched booklet used to be the part of prepress I dreaded. Now it's a layout dropdown and a live preview. Easily the easiest impose tool I've used.", name: 'Maria Gonçalves', role: 'Print production designer' },
  { stars: 4, body: 'Grid printing for flyers and postcards is dead simple now. I set rows and columns and it n-ups the PDF onto the press sheet with bleed and registration marks ready for the printer.', name: 'Rafael Mendes', role: 'Quick-print operator' },
  { stars: 5, body: 'Moved our team over from pdfsnake. Same step-and-repeat and gang-up work, but the live preview means we catch creep and bleed problems before the plate, not after.', name: 'Tomáš Novák', role: 'Studio owner' },
  { stars: 5, body: 'We gang up sticker sheets all day. Drop the artwork, set the grid, add cut marks, and N-up sticker imposition that used to need an Illustrator script now takes one click.', name: 'Daniel Okoye', role: 'Sticker & label print shop' },
  { stars: 5, body: 'The custom imposition options are why I stayed. Odd page sizes, mixed orientations, bespoke grids: PDF Press handles custom impose jobs my old tools just refused.', name: 'Hannah Berg', role: 'Bookbinder & print artist' },
];

// Footer "COMPARE & ALTERNATIVES" links.
export const COMPARE_LINKS = [
  'PDF Press vs Quite Imposing Plus', 'PDF Press vs PDF Snake', 'PDF Press vs Fiery Impose',
  'PDF Press vs Montax Imposer', 'PDF Press vs Imposition Studio', 'Quite Imposing alternative',
  'PDFsnake alternative', 'Montax Imposer alternative', 'Imposition Wizard alternative',
  'Imposer Pro alternative', 'imPRESS Studio alternative', 'DevaliPI alternative',
  'Sejda N-up alternative', 'Online2PDF booklet alternative', 'PDF24 pages-per-sheet alternative',
  'Quark imposition alternative', 'InBooklet alternative', 'BookletCreator alternative',
];

// Footer "POPULAR GUIDES" links.
export const POPULAR_GUIDE_LINKS = [
  'Best imposition software 2026', 'Best prepress software 2026', 'Imposition software for PDF',
  'Free imposition software', 'How to impose a PDF for printing', 'How to print a booklet from PDF',
  'N-up printing guide', 'Step & repeat printing guide', 'Gang run imposition guide',
  'Main prepress software options', 'Color management for print', 'How to tile large-format prints',
  'Creep compensation explained', 'JDF / CIP4 cutting workflow',
];
