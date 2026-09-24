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

// Job cards on the homepage ("One tool, most of the jobs on the board").
// Each one is a job as it arrives at the counter, and the tool that does it.
export const USE_CASES = [
  { title: 'A 24-page programme by Friday', blurb: 'Drop the pages in, choose saddle stitch, and the sheets come out with the signatures in order and creep worked in, ready to fold and staple.', link: 'Booklet imposition', href: '/tools/booklet' },
  { title: 'Five hundred numbered tickets', blurb: 'Load a CSV, place one ticket design, and get serialised sheets with a QR code on every stub and stacks that cut in sequence.', link: 'Variable data', href: '/tools/variable-data' },
  { title: 'A sheet of die-cut labels', blurb: 'Repeat one label to fill the sheet at exact gaps, then add the cut contour and registration the cutter wants.', link: 'Step and repeat', href: '/tools/step-and-repeat' },
  { title: 'Business cards, ten up', blurb: 'Set the card size and bleed, gang them onto 12 × 18 or SRA3, and send the sheet to the guillotine with its cut marks.', link: 'Card sheets', href: '/tools/business-cards' },
  { title: 'A perfect-bound catalogue', blurb: 'Signatures with the spine allowance already worked out, for a squared-back binder rather than a stapler.', link: 'Perfect binding', href: '/tools/perfect-bound-book' },
  { title: 'A wall poster on an office printer', blurb: 'Tile a large-format file across Letter or A4 sheets with overlap and alignment marks, trim and tape.', link: 'Tiled posters', href: '/tools/tiled-poster' },
];

// The six things worth knowing before you open it ("Built the way a press room works").
export const WHY_CARDS = [
  { title: 'Built for the press sheet, not the screen', blurb: 'Booklet signatures with creep, N-up grids, step and repeat, cut and stack, gang sheets, dielines and tiled posters: layouts that exist because a press, a folder and a guillotine exist.' },
  { title: 'Your files stay on your machine', blurb: 'Every page is read, imposed and written back by your own browser. There is no upload step and no server that ever sees a customer’s job.' },
  { title: 'Nothing to install, nothing to license', blurb: 'Open a tab on Windows, macOS, Linux or a Chromebook. No plug-in, no dongle, no per-seat licence, and no account needed to try it.' },
  { title: 'Marks the bindery can use', blurb: 'Crop, bleed, fold, collating, lay and registration marks, colour bars and slug lines, placed in the margins where they belong so nothing prints on the piece next door.' },
  { title: 'Preflight before you commit paper', blurb: 'Low resolution, the wrong colour space, missing bleed, unembedded fonts, hairlines and page counts that will not fold — flagged while the sheet is still on screen.' },
  { title: 'Numbers, names and codes from a spreadsheet', blurb: 'Serialised tickets, badges, coupons and labels from a CSV, a barcode or QR code on each record, and cut-and-stack ordering so the stacks come off the cutter in sequence.' },
];

// Homepage FAQ. Written from how the product actually behaves — see the
// tools above and the plugin — not from a list of search phrases.
export const FAQ = [
  { q: 'Where does the imposition actually happen?', a: 'In the browser tab you have open. The PDF is parsed, the pages are placed and the new file is written by code running on your own computer. Nothing is sent anywhere to be processed.' },
  { q: 'So what is the sign-in for?', a: 'Plans and download limits only. The free plan can use every tool; Pro lifts the cooldown between downloads and adds API access. Neither involves your documents.' },
  { q: 'What kinds of layout can it produce?', a: 'Saddle-stitched and perfect-bound signatures, N-up grids, step and repeat, cut and stack, gang sheets, folded brochures, tiled posters, box and folder dielines, and per-cell custom impositions where the die dictates the positions.' },
  { q: 'How does it deal with creep?', a: 'For folded work it shifts each nested spread inward by the paper thickness you give it, so the outer margins stay even after the booklet is trimmed.' },
  { q: 'Can I set my own sheet size, margins and gutters?', a: 'Yes. There are presets for the common stocks, and every dimension on the sheet — margins, gutters, bleed, mark length and offset — is a field you can type into, in millimetres or inches.' },
  { q: 'Which marks can it add?', a: 'Crop and bleed marks, registration targets, cutter and fold marks, collating and gathering marks for the bindery, OMR marks, lay marks, colour bars, running headers and footers, slug lines, and cut-contour spot colours for die cutting.' },
  { q: 'Will it warn me if the file is not ready to print?', a: 'The preflight tool reports image resolution, colour space, missing bleed, fonts that are not embedded, hairlines below the minimum width, overprint settings and page counts that cannot be folded.' },
  { q: 'Can it number tickets or put names on badges?', a: 'Yes. The variable-data tools take a CSV or spreadsheet and place one record per piece — serial numbers, names, seat numbers — with a QR, Code 128, DataMatrix or EAN-13 code if you want one.' },
  { q: 'Does it produce anything my cutter or MIS can read?', a: 'It can write a CIP4 JDF job ticket alongside the sheet, and it can put cut lines on a named spot colour for cutting tables and plotters.' },
  { q: 'Do I need Acrobat, InDesign or a plug-in?', a: 'No. It is a complete tool on its own. If you have a PDF and a browser, you have everything it needs.' },
  { q: 'What can I bring in?', a: 'PDFs first of all; also JPEG and PNG images for photo and card layouts, and CSV or Excel files for variable data.' },
  { q: 'Is there a limit on pages or file size?', a: 'Only your device’s memory, since the work happens there. Multi-hundred-page books are fine on an ordinary laptop; very large scanned files may be slow.' },
  { q: 'Which browsers and systems does it run on?', a: 'Any current Chrome, Edge, Firefox or Safari, on Windows, macOS, Linux or ChromeOS. There is nothing to download.' },
  { q: 'My booklet came out with pages upside down or out of order. Whose fault is that?', a: 'Almost always the duplex setting on the printer — long-edge versus short-edge flip. Print one test sheet, check the backs, and switch the setting rather than the file.' },
];

// Guides shown on the homepage and /guide.
export const GUIDES = [
  { title: 'Reading a folded dummy', blurb: 'Fold a blank sheet, number the pages, unfold it. The quickest way to see why an imposed sheet looks scrambled and where creep pushes the inner pages.' },
  { title: 'Bleed, trim and safe area in millimetres', blurb: 'How far to extend the art, how far to keep type back from the cut, and why 3 mm is the usual answer to both.' },
  { title: 'Gutters for a slitter versus a guillotine', blurb: 'A slitting cutter steps one constant pitch; a guillotine cuts wherever you set the back gauge. The sheet has to be built for the machine you own.' },
  { title: 'Choosing a signature size', blurb: 'Four, eight, sixteen or thirty-two pages per sheet, and what each choice costs in paper, folding time and binder capacity.' },
  { title: 'Duplex settings that do not flip your backs', blurb: 'Long-edge or short-edge, mirrored back sheets, and the one test sheet that settles it for good.' },
  { title: 'Getting a PDF ready for a RIP', blurb: 'Embedded fonts, CMYK with an output intent, hairlines, overprint, and the handful of checks worth running before a plate is made.' },
];

// Comparison pages, by competitor name. Each has a real page at /compare/<slug>
// (see lib/compare.ts); the labels are matched to it by name.
export const COMPARE_LINKS = [
  'Imposition Wizard', 'Quite Imposing', 'Montax Imposer', 'Kodak Preps', 'PDFsam', 'callas pdfToolbox',
];

// Further guide topics, listed on the homepage and /guide.
export const POPULAR_GUIDE_LINKS = [
  'Saddle stitch or perfect binding?', 'How creep compensation works', 'N-up sheets that trim clean',
  'Step and repeat for labels and stickers', 'Numbering tickets from a spreadsheet',
  'Cut-and-stack ordering explained', 'Tiling a poster across small sheets',
  'Registration for two-sided work', 'Reading a preflight report', 'JDF job tickets for the cutter',
];
