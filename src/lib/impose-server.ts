import 'server-only';
// Server-side imposition adapter. Maps API "steps" to the bundled engine.
// This is the ONLY file coupling the HTTP API to the plugin engine — when the
// plugin is upgraded, extend the OPERATIONS list and the dispatch below.
//
// Steps accept either the flat API shape ({ kind, columns, rows, ... }) or the
// plugin recipe shape ({ kind, opts: { ... } }). `kind` is matched
// case-insensitively and supports both the API's PascalCase ("Grid") and the
// engine's recipe names ("nup").
import {
  imposeNUp, imposeBooklet, imposeNUpBook, imposeCalendar, addCropMarksOnly,
  rotatePdf, flipPdf, cropPdf, resizePdf, shufflePages, nudgePdf,
  addColorBar, addPageNumbers, addTextWatermark, addHeaderFooter, addJobSlug,
  generateBleed, imposeTiledPoster, addRegistrationMarks, addCollatingMarks,
  addGatheringMarks, addFoldMarks, addLayMarks, addOmrMarks, addDimensions,
  addBarcodeStamp, addQrStamp, addCutContour, addWhiteVarnish, addBraille,
  optimizePdf, repairPdf,
} from './imposition-toolkit/impose';

export interface OperationSpec {
  kind: string;
  summary: string;
  fields: Record<string, string>;
}

// Public schema returned by GET /api/v1/operations.
export const OPERATIONS: OperationSpec[] = [
  { kind: 'Grid', summary: 'N-up grid imposition.', fields: { columns: 'int', rows: 'int', sheetWIn: 'number=8.5', sheetHIn: 'number=11', marginIn: 'number=0.25', gutterIn: 'number=0.125', addMarks: 'bool=false' } },
  { kind: 'Booklet', summary: 'Saddle-stitch booklet imposition.', fields: { marginIn: 'number=0.25', gutterIn: 'number=0', creepIn: 'number=0', addMarks: 'bool=false', rtl: 'bool=false' } },
  { kind: 'Poster', summary: 'Tile a large page across sheets.', fields: { tilesAcross: 'int=2', tilesDown: 'int=2', sheetWIn: 'number=8.5', sheetHIn: 'number=11', overlapIn: 'number=0.5' } },
  { kind: 'Rotate', summary: 'Rotate every page.', fields: { angle: '90|180|270' } },
  { kind: 'Flip', summary: 'Mirror every page.', fields: { direction: 'h|v' } },
  { kind: 'Crop', summary: 'Crop every page (inches).', fields: { top: 'number=0', right: 'number=0', bottom: 'number=0', left: 'number=0' } },
  { kind: 'Resize', summary: 'Scale/resize pages.', fields: { opts: 'ResizeOptions (widthIn/heightIn/mode…)' } },
  { kind: 'Shuffle', summary: 'Reorder pages.', fields: { order: 'string="all"' } },
  { kind: 'Nudge', summary: 'Shift page content.', fields: { opts: 'NudgeOptions (dxPt/dyPt…)' } },
  { kind: 'Bleed', summary: 'Add bleed around each page.', fields: { bleedIn: 'number=0.125' } },
  { kind: 'CropMarks', summary: 'Add crop/trim marks.', fields: { bleedIn: 'number=0.125', marginIn: 'number=0.25', markLenIn: 'number=0.25', markOffIn: 'number=0.125' } },
  { kind: 'ColorBar', summary: 'Add a color control strip.', fields: { edge: 'top|bottom=bottom', heightIn: 'number=0.25' } },
  { kind: 'PageNumbers', summary: 'Stamp page numbers.', fields: { position: 'bottom-center|…', startAt: 'int=1', prefix: 'string=', suffix: 'string=', fontSizePt: 'number=10', marginPt: 'number=18' } },
  { kind: 'Watermark', summary: 'Add a text watermark.', fields: { text: 'string', opacity: 'number=0.2', angleDeg: 'number=45', fontSizePt: 'number=48' } },
  { kind: 'HeaderFooter', summary: 'Add header/footer text.', fields: { header: 'string=', footer: 'string=', fontSizePt: 'number=9', marginPt: 'number=18', align: 'left|center|right=center' } },
  { kind: 'JobSlug', summary: 'Add a job-info slug line.', fields: { opts: 'JobSlugOptions' } },
  { kind: 'Registration', summary: 'Add registration targets.', fields: { opts: 'RegMarkOptions' } },
  { kind: 'Collating', summary: 'Add collating marks.', fields: { edge: 'left|right' } },
  { kind: 'Gathering', summary: 'Add gathering marks.', fields: { opts: 'GatheringOptions' } },
  { kind: 'FoldMarks', summary: 'Add fold marks.', fields: { opts: 'FoldMarksOptions' } },
  { kind: 'LayMarks', summary: 'Add lay / gripper marks.', fields: { opts: 'LayMarksOptions' } },
  { kind: 'OmrMarks', summary: 'Add OMR bindery marks.', fields: { opts: 'OmrOptions' } },
  { kind: 'Dimensions', summary: 'Add dimension callouts.', fields: {} },
  { kind: 'Barcode', summary: 'Stamp a barcode (Code128/DataMatrix/EAN-13).', fields: { opts: 'BarcodeStampOptions' } },
  { kind: 'QrStamp', summary: 'Stamp a QR code.', fields: { opts: 'QrStampOptions' } },
  { kind: 'CutContour', summary: 'Add a cut-contour spot toolpath.', fields: { opts: 'CutContourOptions' } },
  { kind: 'WhiteVarnish', summary: 'Add a spot white/varnish layer.', fields: { opts: 'WhiteVarnishOptions' } },
  { kind: 'Braille', summary: 'Add braille.', fields: { opts: 'BrailleOptions' } },
  { kind: 'Optimize', summary: 'Linearize / shrink the PDF.', fields: { opts: 'OptimizeOptions' } },
  { kind: 'Repair', summary: 'Rebuild a damaged PDF.', fields: { opts: 'RepairOptions' } },
  { kind: 'NUpBook', summary: 'N-up book imposition.', fields: { opts: 'NUpBookOptions' } },
  { kind: 'Calendar', summary: 'Calendar imposition.', fields: { opts: 'CalendarOptions' } },
];

const num = (v: unknown, d: number) => (typeof v === 'number' && !Number.isNaN(v) ? v : d);
const bool = (v: unknown, d = false) => (typeof v === 'boolean' ? v : d);
const str = (v: unknown, d = '') => (typeof v === 'string' ? v : d);

// Engine ops that take (bytes, opts) and can run server-side from a plain opts
// object. opts is forwarded as-is (typed loosely) with the engine applying its
// own defaults. Browser-only ops (color effects / management / nesting) are
// intentionally omitted — they need a canvas.
const PASS_THROUGH: Record<string, (b: Uint8Array, o: any) => Promise<Uint8Array>> = {
  resize: (b, o) => resizePdf(b, o),
  nudge: (b, o) => nudgePdf(b, o),
  jobslug: (b, o) => addJobSlug(b, o),
  slug: (b, o) => addJobSlug(b, o),
  registration: (b, o) => addRegistrationMarks(b, o),
  collating: (b, o) => addCollatingMarks(b, { edge: o?.edge === 'right' ? 'right' : 'left', ...o }),
  gathering: (b, o) => addGatheringMarks(b, o),
  foldmarks: (b, o) => addFoldMarks(b, o),
  laymarks: (b, o) => addLayMarks(b, o),
  omr: (b, o) => addOmrMarks(b, o),
  dimensions: (b) => addDimensions(b),
  barcode: (b, o) => addBarcodeStamp(b, o),
  qrstamp: (b, o) => addQrStamp(b, o),
  cutcontour: (b, o) => addCutContour(b, { spotName: 'CutContour', shape: 'rectangle', target: 'trim', ...o }),
  whitevarnish: (b, o) => addWhiteVarnish(b, o),
  braille: (b, o) => addBraille(b, o),
  optimize: (b, o) => optimizePdf(b, o || {}),
  repair: (b, o) => repairPdf(b, o || {}),
  nupbook: (b, o) => imposeNUpBook(b, o),
  calendar: (b, o) => imposeCalendar(b, o),
};

export async function applyStep(bytes: Uint8Array, step: any): Promise<Uint8Array> {
  const kind = String(step?.kind || '');
  const k = kind.toLowerCase();
  // Params may be flat on the step or nested under `opts` (recipe shape).
  const o: any = step && typeof step.opts === 'object' && step.opts ? step.opts : step;

  switch (k) {
    case 'grid':
    case 'nup':
      return imposeNUp(bytes, {
        cols: Math.max(1, num(o.columns ?? o.cols, 2)),
        rows: Math.max(1, num(o.rows, 2)),
        sheetWIn: num(o.sheetWIn, 8.5), sheetHIn: num(o.sheetHIn, 11),
        marginIn: num(o.marginIn, 0.25), gutterIn: num(o.gutterIn, 0.125),
        repeatFirst: bool(o.repeatFirst), addMarks: bool(o.addMarks),
        markLenIn: num(o.markLenIn, 0.25), markOffIn: num(o.markOffIn, 0.125),
        cutStack: bool(o.cutStack),
      });
    case 'booklet':
      return imposeBooklet(bytes, {
        rtl: bool(o.rtl), marginIn: num(o.marginIn, 0.25), gutterIn: num(o.gutterIn, 0),
        creepIn: num(o.creepIn, 0), addMarks: bool(o.addMarks),
        markLenIn: num(o.markLenIn, 0.25), markOffIn: num(o.markOffIn, 0.125),
      });
    case 'poster':
      return imposeTiledPoster(bytes, {
        tilesAcross: Math.max(1, num(o.tilesAcross, 2)), tilesDown: Math.max(1, num(o.tilesDown, 2)),
        sheetWIn: num(o.sheetWIn, 8.5), sheetHIn: num(o.sheetHIn, 11),
        overlapIn: num(o.overlapIn, 0.5), addMarks: bool(o.addMarks),
        markLenIn: num(o.markLenIn, 0.25), markOffIn: num(o.markOffIn, 0.125),
      });
    case 'rotate': {
      const a = num(o.angle ?? o.angleDeg, 90);
      return rotatePdf(bytes, (a === 180 ? 180 : a === 270 ? 270 : 90) as 90 | 180 | 270);
    }
    case 'flip':
      return flipPdf(bytes, o.direction === 'v' ? 'v' : 'h');
    case 'shuffle':
      return shufflePages(bytes, str(o.order, 'all'));
    case 'crop':
      return cropPdf(bytes, { top: num(o.top, 0), right: num(o.right, 0), bottom: num(o.bottom, 0), left: num(o.left, 0) });
    case 'bleed':
      return generateBleed(bytes, { bleedIn: num(o.bleedIn, 0.125) });
    case 'cropmarks':
      return addCropMarksOnly(bytes, { bleedIn: num(o.bleedIn, 0.125), marginIn: num(o.marginIn, 0.25), markLenIn: num(o.markLenIn, 0.25), markOffIn: num(o.markOffIn, 0.125) });
    case 'colorbar':
      return addColorBar(bytes, { edge: o.edge === 'top' ? 'top' : 'bottom', heightIn: num(o.heightIn, 0.25) });
    case 'pagenumbers':
      return addPageNumbers(bytes, { position: str(o.position, 'bottom-center') as any, startAt: num(o.startAt, 1), prefix: str(o.prefix), suffix: str(o.suffix), fontSizePt: num(o.fontSizePt, 10), marginPt: num(o.marginPt, 18) });
    case 'watermark':
      return addTextWatermark(bytes, { text: str(o.text, 'DRAFT'), opacity: num(o.opacity, 0.2), angleDeg: num(o.angleDeg, 45), fontSizePt: num(o.fontSizePt, 48) });
    case 'headerfooter':
      return addHeaderFooter(bytes, { header: str(o.header), footer: str(o.footer), fontSizePt: num(o.fontSizePt, 9), marginPt: num(o.marginPt, 18), align: (o.align === 'left' || o.align === 'right') ? o.align : 'center' });
    // Inspection-only / require extra inputs — treated as no-ops in a pipeline.
    case 'preflight':
    case 'passthrough':
    case 'distort':
      return bytes;
    default: {
      const fn = PASS_THROUGH[k];
      if (fn) return fn(bytes, o);
      throw new Error(`Unsupported operation kind: "${kind}"`);
    }
  }
}

export async function runPipeline(bytes: Uint8Array, steps: any[]): Promise<Uint8Array> {
  let out = bytes;
  for (const step of steps) out = await applyStep(out, step);
  return out;
}
