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
  /** show on the curated homepage gallery (has dedicated mockup art) */
  featured?: boolean;
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
  { slug: 'standard-sizes', name: 'Standard Sizes', blurb: '19 presets: Letter, A4, SRA3 and more.', category: 'imposition', engine: 'nup', inPlugin: true, featured: true, cta: 'Start imposing' },
  { slug: 'n-up-book', name: 'N-up Book', blurb: 'Booklet pages, imposed automatically.', category: 'imposition', engine: 'nupbook', inPlugin: true, featured: true, cta: 'Build n-up book' },
  { slug: 'cut-and-stack', name: 'Cut & Stack', blurb: 'Sequential numbers across cut stacks.', category: 'imposition', engine: 'nup', inPlugin: true, featured: true, cta: 'Cut & stack' },
  { slug: 'expert-grid', name: 'Expert Grid', blurb: 'Full control over rows, gutters and margins.', category: 'imposition', engine: 'nup', inPlugin: true, featured: true, cta: 'Open expert grid' },
  { slug: 'optimal-fit', name: 'Optimal Fit', blurb: 'Pack the most pages per sheet.', category: 'imposition', engine: 'nup', inPlugin: true, featured: true, cta: 'Auto-fit pages' },
  { slug: 'gang-sheet', name: 'Gang Sheet', blurb: 'Many jobs on one press sheet.', category: 'imposition', engine: 'nup', inPlugin: true, featured: true, cta: 'Build gang sheet' },
  { slug: 'index-print', name: 'Index Print', blurb: 'A contact sheet of every page.', category: 'imposition', engine: 'nup', inPlugin: true, featured: true, cta: 'Make an index' },
  { slug: 'photo-prints', name: 'Photo Prints', blurb: 'Full-bleed photo cards, ganged up.', category: 'imposition', engine: 'nup', inPlugin: true, cta: 'Print photos' },
  { slug: 'flyers', name: 'Flyers', blurb: 'Two-sided flyers, imposed for print.', category: 'imposition', engine: 'nup', inPlugin: true, cta: 'Impose flyers' },
  { slug: 'custom-impose', name: 'Custom Impose', blurb: 'Per-cell placement for bespoke impositions.', category: 'imposition', engine: 'customgrid', inPlugin: true, cta: 'Open custom impose' },

  // ── What you can make (booklets, cards, folding, large format) ──────────────
  { slug: 'booklet', name: 'Booklet', blurb: 'Saddle-stitch & perfect-bound spreads.', category: 'make', engine: 'booklet', inPlugin: true, featured: true, cta: 'Make a booklet' },
  { slug: 'saddle-stitch-magazine', name: 'Saddle-Stitch Magazine', blurb: 'Stapled magazines & booklets.', category: 'make', engine: 'booklet', inPlugin: true, featured: true, cta: 'Make a magazine' },
  { slug: 'perfect-bound-book', name: 'Perfect-Bound Book', blurb: 'Squared-spine books & catalogs.', category: 'make', engine: 'booklet', inPlugin: true, featured: true, cta: 'Make a book' },
  { slug: 'zine', name: 'Zine', blurb: '8-page zine from a single sheet.', category: 'make', engine: 'booklet', inPlugin: true, featured: true, cta: 'Make a zine' },
  { slug: 'event-program', name: 'Event Program', blurb: 'Playbills & orders of service.', category: 'make', engine: 'booklet', inPlugin: true, cta: 'Make a program' },
  { slug: 'catalog', name: 'Catalog', blurb: 'Digest catalogs & product books.', category: 'make', engine: 'booklet', inPlugin: true, cta: 'Make a catalog' },
  { slug: 'comic', name: 'Comic / Manga', blurb: 'Drop one PDF — all pages imposed into a comic booklet.', category: 'make', engine: 'booklet', inPlugin: true, cta: 'Make a comic' },
  { slug: 'graphic-novel', name: 'Graphic Novel', blurb: 'One PDF in, squared-spine perfect-bound signatures out.', category: 'make', engine: 'booklet', inPlugin: true, cta: 'Make a graphic novel' },
  { slug: 'notebook', name: 'Notebook', blurb: 'Pocket books & notebooks.', category: 'make', engine: 'booklet', inPlugin: true, cta: 'Make a notebook' },
  { slug: 'flip-book', name: 'Flip Book', blurb: 'Frame-grid flip books.', category: 'make', engine: 'nup', inPlugin: true, cta: 'Make a flip book' },
  { slug: 'business-cards', name: 'Business Cards', blurb: 'Gang multiple cards per sheet.', category: 'make', engine: 'nup', inPlugin: true, featured: true, cta: 'Impose cards' },
  { slug: 'trading-cards', name: 'Trading Cards', blurb: '9-up trading card sheets.', category: 'make', engine: 'nup', inPlugin: true, cta: 'Make trading cards' },
  { slug: 'stickers', name: 'Stickers', blurb: 'Die-cut sticker sheets, ganged up.', category: 'make', engine: 'nup', inPlugin: true, featured: true, cta: 'Make stickers' },
  { slug: 'step-and-repeat', name: 'Step & Repeat', blurb: 'One design, repeated across the sheet.', category: 'make', engine: 'nup', inPlugin: true, featured: true, cta: 'Step & repeat' },
  { slug: 'calendar', name: 'Calendar', blurb: 'Build print-ready calendar layouts.', category: 'make', engine: 'calendar', inPlugin: true, featured: true, cta: 'Make a calendar' },
  { slug: 'postcards', name: 'Postcards', blurb: 'Full-bleed postcards, ganged up.', category: 'make', engine: 'nup', inPlugin: true, cta: 'Make postcards' },
  { slug: 'labels', name: 'Labels', blurb: 'Avery-style label sheets.', category: 'make', engine: 'nup', inPlugin: true, cta: 'Make labels' },
  { slug: 'bookmarks', name: 'Bookmarks', blurb: 'Bookmarks, ganged up with cut marks.', category: 'make', engine: 'nup', inPlugin: true, cta: 'Make bookmarks' },
  { slug: 'hang-tags', name: 'Hang Tags', blurb: 'Retail hang tags, imposed.', category: 'make', engine: 'nup', inPlugin: true, cta: 'Make hang tags' },
  { slug: 'coasters', name: 'Coasters', blurb: 'Square coasters, ganged up.', category: 'make', engine: 'nup', inPlugin: true, cta: 'Make coasters' },
  { slug: 'letterhead', name: 'Letterhead', blurb: 'Letterhead gang runs.', category: 'make', engine: 'nup', inPlugin: true, cta: 'Impose letterhead' },
  { slug: 'compliment-slips', name: 'Compliment Slips', blurb: 'DL compliment slips, 3-up.', category: 'make', engine: 'nup', inPlugin: true, cta: 'Make slips' },
  { slug: 'ncr-pads', name: 'NCR Pads', blurb: 'Multi-part carbonless forms.', category: 'make', engine: 'nup', inPlugin: true, cta: 'Make NCR pads' },
  { slug: 'envelopes', name: 'Envelopes', blurb: 'Envelope flats, ganged up.', category: 'make', engine: 'nup', inPlugin: true, cta: 'Impose envelopes' },
  { slug: 'trifold-brochure', name: 'Trifold Brochure', blurb: 'Roll-fold & gate-fold leaflets.', category: 'make', engine: 'nup', inPlugin: true, featured: true, cta: 'Make a brochure' },
  { slug: 'folded-brochure', name: 'Folded Brochure', blurb: 'Roll-fold, Z-fold & gate-fold.', category: 'make', engine: 'nup', inPlugin: true, featured: true, cta: 'Fold a brochure' },
  { slug: 'greeting-card', name: 'Greeting Card', blurb: 'Folded greeting cards.', category: 'make', engine: 'booklet', inPlugin: true, cta: 'Make a card' },
  { slug: 'menu', name: 'Menu', blurb: 'Bi-fold restaurant menus.', category: 'make', engine: 'booklet', inPlugin: true, cta: 'Make a menu' },
  { slug: 'wedding-invitation', name: 'Wedding Invitation', blurb: 'Invitation cards, 2-up.', category: 'make', engine: 'nup', inPlugin: true, cta: 'Make invitations' },
  { slug: 'presentation-folder', name: 'Presentation Folder', blurb: 'Pocket folder dielines.', category: 'make', engine: 'dieline', inPlugin: true, cta: 'Make a folder' },
  { slug: 'tiled-poster', name: 'Tiled Poster', blurb: 'Big posters from small sheets.', category: 'make', engine: 'poster', inPlugin: true, featured: true, cta: 'Tile a poster' },
  { slug: 'banner', name: 'Banner', blurb: 'Large-format banners, tiled.', category: 'make', engine: 'poster', inPlugin: true, cta: 'Make a banner' },
  { slug: 'feather-flags', name: 'Feather Flags', blurb: 'Feather & teardrop flags.', category: 'make', engine: 'nup', inPlugin: true, cta: 'Make a flag' },
  { slug: 'roller-banner', name: 'Roller Banner', blurb: 'Pull-up roller banners.', category: 'make', engine: 'nup', inPlugin: true, cta: 'Make a roller banner' },
  { slug: 'packaging-dieline', name: 'Packaging Dieline', blurb: 'Boxes, cartons & custom shapes.', category: 'make', engine: 'dieline', inPlugin: true, featured: true, cta: 'Add a dieline' },
  { slug: 'box-carton', name: 'Box / Carton', blurb: 'Box & carton nets from W×H×D.', category: 'make', engine: 'dieline', inPlugin: true, cta: 'Make a box' },

  // ── Marks, color & prepress ────────────────────────────────────────────────
  { slug: 'bleed-crop-marks', name: 'Bleed & Crop Marks', blurb: 'Print edge-to-edge with confidence.', category: 'marks', engine: 'bleed', inPlugin: true, featured: true, cta: 'Add marks' },
  { slug: 'cutter-marks', name: 'Cutter Marks', blurb: 'Registration & cutter guides on every tile.', category: 'marks', engine: 'cropmarks', inPlugin: true, featured: true, cta: 'Add cutter marks' },
  { slug: 'color-bar-header', name: 'Color Bar & Header', blurb: 'Running headers, footers and control strips.', category: 'marks', engine: 'colorbar', inPlugin: true, featured: true, cta: 'Add header & bar' },
  { slug: 'page-numbering', name: 'Page Numbering & Bates', blurb: 'Sequential & Bates stamps on every page.', category: 'marks', engine: 'pagenumbers', inPlugin: true, featured: true, cta: 'Number pages' },
  { slug: 'preflight', name: 'Preflight Inspector', blurb: 'Catch print problems before output.', category: 'marks', engine: 'preflight', inPlugin: true, featured: true, cta: 'Run preflight' },
  { slug: 'variable-data', name: 'Variable Data Printing', blurb: 'Serialize tickets, badges & labels from CSV.', category: 'marks', engine: 'datamerge', inPlugin: true, featured: true, cta: 'Open VDP wizard' },
  { slug: 'registration-marks', name: 'Registration Marks', blurb: 'Press registration targets on every sheet.', category: 'marks', engine: 'registration', inPlugin: true, featured: true, cta: 'Add registration' },
  { slug: 'barcode-qr', name: 'Barcode / QR', blurb: 'QR, Code 128, DataMatrix & EAN-13 stamps.', category: 'marks', engine: 'barcode', inPlugin: true, featured: true, cta: 'Add a barcode' },
  { slug: 'watermark', name: 'Watermark', blurb: 'Stamp a text or image watermark.', category: 'marks', engine: 'watermark', inPlugin: true, featured: true, cta: 'Add watermark' },
  { slug: 'backdrop', name: 'Backdrop', blurb: 'Composite a PDF or image behind pages.', category: 'marks', engine: 'backdropfile', inPlugin: true, featured: true, cta: 'Add a backdrop' },
  { slug: 'color-management', name: 'Color Management', blurb: 'RGB→CMYK with ICC output intents.', category: 'marks', engine: 'colormanage', inPlugin: true, featured: true, cta: 'Convert color' },
  { slug: 'color-effects', name: 'Color Effects', blurb: 'Grayscale, sepia, invert & filter stacks.', category: 'marks', engine: 'coloreffects', inPlugin: true, cta: 'Apply effects' },
  { slug: 'header-footer', name: 'Header or Footer', blurb: 'Running headers and footers.', category: 'marks', engine: 'headerfooter', inPlugin: true, cta: 'Add header/footer' },
  { slug: 'slugline', name: 'Slugline', blurb: 'Job-info slug line on every sheet.', category: 'marks', engine: 'slug', inPlugin: true, cta: 'Add a slug' },
  { slug: 'collating-marks', name: 'Collating Marks', blurb: 'Spine collation marks for gathering.', category: 'marks', engine: 'collating', inPlugin: true, cta: 'Add collating marks' },
  { slug: 'omr-marks', name: 'OMR Marks', blurb: 'Optical mark-recognition bindery marks.', category: 'marks', engine: 'omr', inPlugin: true, cta: 'Add OMR marks' },
  { slug: 'gathering-marks', name: 'Gathering Marks', blurb: 'Section gathering marks.', category: 'marks', engine: 'gathering', inPlugin: true, cta: 'Add gathering marks' },
  { slug: 'fold-marks', name: 'Folding Marks', blurb: 'Fold guides for finishing.', category: 'marks', engine: 'foldmarks', inPlugin: true, cta: 'Add fold marks' },
  { slug: 'lay-marks', name: 'Lay Marks', blurb: 'Lay / gripper edge marks.', category: 'marks', engine: 'laymarks', inPlugin: true, cta: 'Add lay marks' },
  { slug: 'die-lines', name: 'Die Lines', blurb: 'Cut-contour spot toolpaths.', category: 'marks', engine: 'cutcontour', inPlugin: true, cta: 'Add die lines' },
  { slug: 'white-varnish', name: 'White / Varnish', blurb: 'Spot white and varnish separation layers.', category: 'marks', engine: 'whitevarnish', inPlugin: true, cta: 'Add a spot layer' },
  { slug: 'braille', name: 'Braille', blurb: 'Compliant braille for packaging.', category: 'marks', engine: 'braille', inPlugin: true, cta: 'Add braille' },
  { slug: 'dimensions', name: 'Dimensions', blurb: 'Dimension lines & measurement callouts.', category: 'marks', engine: 'dimensions', inPlugin: true, cta: 'Add dimensions' },
  { slug: 'background-fill', name: 'Background Fill', blurb: 'Solid color fill behind page content.', category: 'marks', engine: 'backdrop', inPlugin: true, cta: 'Add a fill' },
  { slug: 'raffle-tickets', name: 'Raffle Tickets', blurb: 'Numbered raffle tickets with stubs.', category: 'marks', engine: 'tickets', inPlugin: true, cta: 'Make raffle tickets' },
  { slug: 'coupons', name: 'Coupons', blurb: 'Serialized coupons & vouchers.', category: 'marks', engine: 'datamerge', inPlugin: true, cta: 'Make coupons' },
  { slug: 'name-badges', name: 'Name Badges', blurb: 'Event name badges from a spreadsheet.', category: 'marks', engine: 'datamerge', inPlugin: true, cta: 'Make badges' },

  // ── Page & PDF tools ───────────────────────────────────────────────────────
  { slug: 'rotate', name: 'Rotate', blurb: 'Spin pages to the right angle.', category: 'pages', engine: 'rotate', inPlugin: true, featured: true, cta: 'Rotate pages' },
  { slug: 'crop', name: 'Crop', blurb: 'Trim pages to the area you need.', category: 'pages', engine: 'crop', inPlugin: true, featured: true, cta: 'Crop pages' },
  { slug: 'split', name: 'Split PDF', blurb: 'Break one PDF into many.', category: 'pages', engine: 'split', inPlugin: true, featured: true, cta: 'Split a PDF' },
  { slug: 'flip', name: 'Flip / Mirror', blurb: 'Mirror pages horizontally or vertically.', category: 'pages', engine: 'flip', inPlugin: true, featured: true, cta: 'Flip pages' },
  { slug: 'merge', name: 'Merge PDFs', blurb: 'Combine files into one document.', category: 'pages', engine: 'merge', inPlugin: true, featured: true, cta: 'Merge PDFs' },
  { slug: 'overlay', name: 'Overlay', blurb: 'Stamp one PDF on top of another.', category: 'pages', engine: 'overlay', inPlugin: true, featured: true, cta: 'Overlay PDFs' },
  { slug: 'shuffle', name: 'Shuffle', blurb: 'Reorder, reverse and repeat pages.', category: 'pages', engine: 'shuffle', inPlugin: true, featured: true, cta: 'Shuffle pages' },
  { slug: 'nudge', name: 'Nudge', blurb: 'Fine-tune page position.', category: 'pages', engine: 'nudge', inPlugin: true, featured: true, cta: 'Nudge pages' },
  { slug: 'resize', name: 'Resize / Scale', blurb: 'Scale pages to a new size.', category: 'pages', engine: 'resize', inPlugin: true, cta: 'Resize pages' },
  { slug: 'insert-pages', name: 'Insert Pages', blurb: 'Insert blanks or pages into a PDF.', category: 'pages', engine: 'insert', inPlugin: true, cta: 'Insert pages' },
  { slug: 'mix', name: 'Mix / Interleave', blurb: 'Interleave pages from two PDFs.', category: 'pages', engine: 'mix', inPlugin: true, cta: 'Mix PDFs' },
  { slug: 'edit-pdf', name: 'Edit PDF', blurb: 'Add text, redact, rotate & delete pages.', category: 'pages', engine: 'editpdf', inPlugin: true, cta: 'Edit a PDF' },
  { slug: 'distortion-comp', name: 'Distortion Comp.', blurb: 'Compensate for flexo / cylinder distortion.', category: 'pages', engine: 'distort', inPlugin: true, cta: 'Compensate distortion' },

  // ── Advanced ───────────────────────────────────────────────────────────────
  { slug: 'layers', name: 'Layers', blurb: 'Toggle and flatten PDF layers.', category: 'advanced', engine: 'layers', inPlugin: true, featured: true, cta: 'Manage layers' },
  { slug: 'pdf-tools', name: 'PDF Tools', blurb: 'Optimize, decrypt and repair PDFs.', category: 'advanced', engine: 'pdftools', inPlugin: true, cta: 'Open PDF tools' },
  { slug: 'pdf-repair', name: 'PDF Repair', blurb: 'Rebuild and recover damaged PDFs.', category: 'advanced', engine: 'repair', inPlugin: true, cta: 'Repair a PDF' },
  { slug: 'jdf-export', name: 'JDF / CIP4 Export', blurb: 'Emit a CIP4 JDF job ticket.', category: 'advanced', engine: 'jdf', inPlugin: true, featured: true, cta: 'Export JDF' },
  { slug: 'nesting', name: 'Nesting / Stickers', blurb: 'True-shape sticker & label nesting.', category: 'advanced', engine: 'nest', inPlugin: true, cta: 'Nest shapes' },
  { slug: 'page-preview', name: 'Page Preview', blurb: 'See every imposed sheet before you print.', category: 'advanced', engine: 'preview', inPlugin: true, cta: 'Open a document' },
];

export function toolsByCategory(cat: ToolCategory): Tool[] {
  return TOOLS.filter((t) => t.category === cat);
}

export function findTool(slug: string): Tool | undefined {
  return TOOLS.find((t) => t.slug === slug);
}

// Maps a marketing tool slug to the plugin editor's internal tool id so a tile
// can deep-link straight into that tool's workspace (`/app?tool=<id>`) instead
// of dropping the user on the bare gallery.
export const SLUG_TO_PLUGIN_ID: Record<string, string> = {
  'standard-sizes': 'standardsizes', 'n-up-book': 'nupbook', 'cut-and-stack': 'cutstack',
  'expert-grid': 'expertgrid', 'optimal-fit': 'optimalfit', 'gang-sheet': 'gangsheet',
  'index-print': 'contact', 'photo-prints': 'photo', 'flyers': 'flyer', 'custom-impose': 'customgrid',
  'booklet': 'booklet', 'saddle-stitch-magazine': 'magazine', 'perfect-bound-book': 'perfectbound',
  'zine': 'zine', 'event-program': 'program', 'catalog': 'catalog', 'comic': 'comic',
  'graphic-novel': 'perfectbound', 'notebook': 'notebook', 'flip-book': 'flipbook',
  'business-cards': 'business', 'trading-cards': 'trading', 'stickers': 'stickers',
  'step-and-repeat': 'steprepeat', 'calendar': 'calendar', 'postcards': 'postcard', 'labels': 'labels',
  'bookmarks': 'bookmark', 'hang-tags': 'hangtag', 'coasters': 'coasters', 'letterhead': 'letterhead',
  'compliment-slips': 'complimentslip', 'ncr-pads': 'ncrpads', 'envelopes': 'envelope',
  'trifold-brochure': 'trifold', 'folded-brochure': 'zfold', 'greeting-card': 'greeting', 'menu': 'menu',
  'wedding-invitation': 'wedding', 'presentation-folder': 'presfolder', 'tiled-poster': 'poster',
  'banner': 'banner', 'feather-flags': 'featherflag', 'roller-banner': 'rollerbanner',
  'packaging-dieline': 'packaging', 'box-carton': 'boxcarton', 'bleed-crop-marks': 'bleedmarks',
  'cutter-marks': 'cropmarks', 'color-bar-header': 'colorbar', 'page-numbering': 'pagenumbers',
  'preflight': 'preflight', 'variable-data': 'tickets', 'registration-marks': 'registration',
  'barcode-qr': 'qrstamp', 'watermark': 'watermark', 'backdrop': 'backdrop',
  'color-management': 'colormanage', 'color-effects': 'coloreffects', 'header-footer': 'headerfooter',
  'slugline': 'slug', 'collating-marks': 'collating', 'omr-marks': 'omr', 'gathering-marks': 'gathering',
  'fold-marks': 'foldmarks', 'lay-marks': 'laymarks', 'die-lines': 'cutcontour',
  'white-varnish': 'whitevarnish', 'braille': 'braille', 'dimensions': 'dimensions',
  'background-fill': 'backdropfile', 'raffle-tickets': 'raffle', 'coupons': 'coupons',
  'name-badges': 'namebadge', 'rotate': 'rotate', 'crop': 'crop', 'split': 'split', 'flip': 'flip',
  'merge': 'merge', 'overlay': 'overlay', 'shuffle': 'shuffle', 'nudge': 'nudge', 'resize': 'resize',
  'insert-pages': 'insertpages', 'mix': 'mix', 'edit-pdf': 'editpdf', 'distortion-comp': 'distort',
  'layers': 'layers', 'pdf-tools': 'pdftools', 'pdf-repair': 'repair', 'jdf-export': 'jdf',
  'nesting': 'nest', 'page-preview': 'dimensions',
};

// The editor URL a tile should link to. Deep-links into the specific tool's
// workspace when we know its plugin id; otherwise opens the gallery.
export function toolAppHref(slug: string): string {
  const id = SLUG_TO_PLUGIN_ID[slug];
  return id ? `/app?tool=${id}` : '/app';
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

// "Why print pros choose ImpositionPDF" feature cards.
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
  { q: 'Is ImpositionPDF an imposition program?', a: 'Yes. ImpositionPDF is browser-based imposition software: booklets, N-up, step-and-repeat, cut-and-stack, gang sheets, dielines and prepress marks — all running locally in your browser.' },
  { q: 'What does it mean to impose a PDF?', a: 'To impose a PDF is to place its pages onto a press sheet with the correct rotation, order, margins, gutters and marks so the printed sheet folds and trims into a finished product.' },
  { q: 'How do I impose a PDF?', a: 'Open ImpositionPDF, drop in your PDF, pick a layout (booklet, N-up, step & repeat…), set the sheet size, margins, bleed and marks, preview the result and export a print-ready PDF.' },
  { q: 'Can I impose a PDF online for free?', a: 'Yes. The free tier lets you use every tool in the browser. Pro removes download cooldowns for unlimited output.' },
  { q: "What's the difference between imposition and prepress?", a: 'Prepress is everything that prepares a file for printing — color conversion, preflight, marks, trapping. Imposition is the specific prepress step of laying pages out on the press sheet.' },
  { q: 'What is a printing signature?', a: 'A signature is a single sheet printed with multiple pages that, once folded, forms a section of a book — commonly 4, 8, 16 or 32 pages.' },
  { q: 'What is the best free imposition software?', a: 'ImpositionPDF is a strong free, browser-based option: no install, no per-seat license, and files never leave your device.' },
  { q: 'What is step-and-repeat printing?', a: 'Step-and-repeat places one design many times across a sheet with precise spacing and cut marks — ideal for business cards, labels and stickers.' },
  { q: 'Is ImpositionPDF a good Fiery Impose or Quite Imposing alternative?', a: 'Yes. ImpositionPDF does booklets, N-up and step-and-repeat in the browser without the per-seat license cost of desktop imposers.' },
  { q: 'How do I add bleed and crop marks to a PDF?', a: 'Use the Bleed & Crop Marks tool: set your bleed amount and mark length, and ImpositionPDF adds trim, bleed and crop marks around every page.' },
  { q: 'How do I put multiple PDF pages on one sheet (N-up)?', a: 'Use the N-up / Grid tool: choose rows and columns, sheet size, gutters and margins, and ImpositionPDF arranges the pages onto each sheet.' },
  { q: 'How do I make a booklet from a PDF?', a: 'Use the Booklet tool. It reorders pages into saddle-stitch or perfect-bound signatures with automatic creep compensation.' },
  { q: 'How do I impose business cards for printing?', a: 'Use Business Cards / Step & Repeat: set the card size and bleed, and gang many cards per sheet with cut marks.' },
  { q: 'Does ImpositionPDF do variable data printing (VDP)?', a: 'Yes. Upload a CSV and ImpositionPDF serializes tickets, vouchers, badges and labels — including a scannable QR code per record.' },
  { q: 'What is cut-and-stack imposition?', a: 'Cut-and-stack lays out sequential numbers so that after printing, cutting and stacking, each stack is in consecutive order — used for numbered tickets and cards.' },
  { q: 'What is the Expert grid for?', a: 'The Expert Grid gives full manual control over rows, columns, gutters, margins and per-cell placement for bespoke impositions.' },
  { q: 'Can I run preflight checks on my PDF?', a: 'Yes. The Preflight Inspector checks resolution, color space, bleed, fonts, overprint and minimum line width before output.' },
  { q: 'Does ImpositionPDF export JDF or cut files?', a: 'Yes. JDF / CIP4 export emits a CIP4 JDF 1.4 job ticket for your MIS or cutter workflow, and the Die Lines tool adds cut-contour spot toolpaths.' },
  { q: 'Can I impose a PDF without Adobe Acrobat or InDesign?', a: 'Yes — ImpositionPDF runs entirely in your browser, no Adobe software required.' },
  { q: 'How many pages should a booklet PDF have?', a: 'Saddle-stitch booklets need a page count divisible by 4. ImpositionPDF pads with blanks automatically if needed.' },
  { q: 'Who is ImpositionPDF for?', a: 'Print shops, copy centers, designers, prepress operators, publishers, packaging and label printers — anyone preparing files for print.' },
  { q: 'How does the browser-based tool work?', a: 'ImpositionPDF reads your file with the browser File API, imposes it in memory with pdf-lib, and hands back a downloadable PDF — nothing is uploaded.' },
  { q: 'Is my file uploaded anywhere?', a: 'No. All processing is local to your browser. There is no server component that touches your document contents.' },
  { q: 'What file types and sizes are supported?', a: 'PDF is the primary input; images and CSV are supported for photo layouts and variable data. Large files are handled in-browser subject to your device memory.' },
  { q: 'Do I need Adobe Acrobat or any install?', a: 'No install of any kind. ImpositionPDF works in any modern browser on any operating system.' },
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
  { stars: 5, body: "Our shop used to keep one seat of desktop imposition software just for booklets. We cancelled it. ImpositionPDF handles the saddle-stitch and N-up jobs in the browser and the whole counter team can use it.", name: 'Greg Halstead', role: 'Owner, neighborhood copy shop' },
  { stars: 5, body: "I lay out comic and manga interiors and the page order always tripped up the printer. Now I drop one PDF, pick right-to-left, and the signatures come out correct the first time.", name: 'Priya Nair', role: 'Indie comics publisher' },
  { stars: 4, body: 'Ganging business cards used to mean fighting with a template. I set the card size and bleed, it fills the sheet with cut marks, and I send it straight to the cutter. Wish it remembered my presets.', name: 'Marcus Feldt', role: 'Trade printer' },
  { stars: 5, body: "The live preview is the whole thing for me. I can see creep and bleed problems before I burn a plate instead of after. It has genuinely saved us reprints.", name: 'Elena Vasquez', role: 'Prepress operator' },
  { stars: 5, body: 'We run a small sticker business and step-and-repeat plus cut contours used to need an Illustrator script. Drop the art, set the grid, done — it paid for itself the first week.', name: 'Tunde Bakare', role: 'Sticker & label maker' },
  { stars: 5, body: "Perfect-bound signatures with the spine creep handled automatically is exactly what our catalog work needed. No account required to test it either, which is how it got past our IT.", name: 'Johanna Krause', role: 'Production manager, book printer' },
  { stars: 4, body: 'I do a lot of quick flyers and postcards N-up on 12×18. Set rows and columns, add registration marks, export. Fast and predictable. Would love more paper-size presets.', name: 'Sam O’Doherty', role: 'Quick-print operator' },
  { stars: 5, body: 'Runs on my laptop, my shop PC, even a Chromebook, and the files never leave the machine — that mattered for a couple of confidential jobs. Same key works for the API too.', name: 'Naomi Sotelo', role: 'Freelance designer' },
  { stars: 5, body: 'Odd trim sizes and mixed orientations are where most tools give up. The custom impose grid let me place each cell exactly where the die needed it. Nothing else I tried could do it.', name: 'Viktor Petrov', role: 'Packaging & dieline specialist' },
];

// Footer "COMPARE & ALTERNATIVES" links.
export const COMPARE_LINKS = [
  'ImpositionPDF vs Quite Imposing Plus', 'ImpositionPDF vs PDF Snake', 'ImpositionPDF vs Fiery Impose',
  'ImpositionPDF vs Montax Imposer', 'ImpositionPDF vs Imposition Studio', 'Quite Imposing alternative',
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
