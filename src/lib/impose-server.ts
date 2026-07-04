import 'server-only';
// Server-side imposition adapter. Maps API "steps" to the bundled engine.
// This is the ONLY file coupling the HTTP API to the plugin engine — when the
// plugin is upgraded, extend the OPERATIONS map and the switch here.
import {
  imposeNUp, imposeBooklet, addCropMarksOnly, rotatePdf, flipPdf, cropPdf,
  addColorBar, addPageNumbers, addTextWatermark, addHeaderFooter, generateBleed,
  imposeTiledPoster,
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
  { kind: 'Bleed', summary: 'Add bleed around each page.', fields: { bleedIn: 'number=0.125' } },
  { kind: 'CropMarks', summary: 'Add crop/trim marks.', fields: { bleedIn: 'number=0.125', marginIn: 'number=0.25', markLenIn: 'number=0.25', markOffIn: 'number=0.125' } },
  { kind: 'ColorBar', summary: 'Add a color control strip.', fields: { edge: 'top|bottom=bottom', heightIn: 'number=0.25' } },
  { kind: 'PageNumbers', summary: 'Stamp page numbers.', fields: { position: 'bottom-center|…=bottom-center', startAt: 'int=1', prefix: 'string=', suffix: 'string=', fontSizePt: 'number=10', marginPt: 'number=18' } },
  { kind: 'Watermark', summary: 'Add a text watermark.', fields: { text: 'string', opacity: 'number=0.2', angleDeg: 'number=45', fontSizePt: 'number=48' } },
  { kind: 'HeaderFooter', summary: 'Add header/footer text.', fields: { header: 'string=', footer: 'string=', fontSizePt: 'number=9', marginPt: 'number=18', align: 'left|center|right=center' } },
];

const num = (v: unknown, d: number) => (typeof v === 'number' && !Number.isNaN(v) ? v : d);
const bool = (v: unknown, d = false) => (typeof v === 'boolean' ? v : d);
const str = (v: unknown, d = '') => (typeof v === 'string' ? v : d);

export async function applyStep(bytes: Uint8Array, step: any): Promise<Uint8Array> {
  const kind = String(step?.kind || '');
  switch (kind) {
    case 'Grid':
    case 'NUp':
      return imposeNUp(bytes, {
        cols: Math.max(1, num(step.columns ?? step.cols, 2)),
        rows: Math.max(1, num(step.rows, 2)),
        sheetWIn: num(step.sheetWIn, 8.5), sheetHIn: num(step.sheetHIn, 11),
        marginIn: num(step.marginIn, 0.25), gutterIn: num(step.gutterIn, 0.125),
        repeatFirst: bool(step.repeatFirst), addMarks: bool(step.addMarks),
        markLenIn: num(step.markLenIn, 0.25), markOffIn: num(step.markOffIn, 0.125),
        cutStack: bool(step.cutStack),
      });
    case 'Booklet':
      return imposeBooklet(bytes, {
        rtl: bool(step.rtl), marginIn: num(step.marginIn, 0.25), gutterIn: num(step.gutterIn, 0),
        creepIn: num(step.creepIn, 0), addMarks: bool(step.addMarks),
        markLenIn: num(step.markLenIn, 0.25), markOffIn: num(step.markOffIn, 0.125),
      });
    case 'Poster':
      return imposeTiledPoster(bytes, {
        tilesAcross: Math.max(1, num(step.tilesAcross, 2)), tilesDown: Math.max(1, num(step.tilesDown, 2)),
        sheetWIn: num(step.sheetWIn, 8.5), sheetHIn: num(step.sheetHIn, 11),
        overlapIn: num(step.overlapIn, 0.5), addMarks: bool(step.addMarks),
        markLenIn: num(step.markLenIn, 0.25), markOffIn: num(step.markOffIn, 0.125),
      });
    case 'Rotate': {
      const a = num(step.angle, 90);
      return rotatePdf(bytes, (a === 180 ? 180 : a === 270 ? 270 : 90) as 90 | 180 | 270);
    }
    case 'Flip':
      return flipPdf(bytes, step.direction === 'v' ? 'v' : 'h');
    case 'Crop':
      return cropPdf(bytes, { top: num(step.top, 0), right: num(step.right, 0), bottom: num(step.bottom, 0), left: num(step.left, 0) });
    case 'Bleed':
      return generateBleed(bytes, { bleedIn: num(step.bleedIn, 0.125) });
    case 'CropMarks':
      return addCropMarksOnly(bytes, { bleedIn: num(step.bleedIn, 0.125), marginIn: num(step.marginIn, 0.25), markLenIn: num(step.markLenIn, 0.25), markOffIn: num(step.markOffIn, 0.125) });
    case 'ColorBar':
      return addColorBar(bytes, { edge: step.edge === 'top' ? 'top' : 'bottom', heightIn: num(step.heightIn, 0.25) });
    case 'PageNumbers':
      return addPageNumbers(bytes, { position: str(step.position, 'bottom-center') as any, startAt: num(step.startAt, 1), prefix: str(step.prefix), suffix: str(step.suffix), fontSizePt: num(step.fontSizePt, 10), marginPt: num(step.marginPt, 18) });
    case 'Watermark':
      return addTextWatermark(bytes, { text: str(step.text, 'DRAFT'), opacity: num(step.opacity, 0.2), angleDeg: num(step.angleDeg, 45), fontSizePt: num(step.fontSizePt, 48) });
    case 'HeaderFooter':
      return addHeaderFooter(bytes, { header: str(step.header), footer: str(step.footer), fontSizePt: num(step.fontSizePt, 9), marginPt: num(step.marginPt, 18), align: (step.align === 'left' || step.align === 'right') ? step.align : 'center' });
    default:
      throw new Error(`Unsupported operation kind: "${kind}"`);
  }
}

export async function runPipeline(bytes: Uint8Array, steps: any[]): Promise<Uint8Array> {
  let out = bytes;
  for (const step of steps) out = await applyStep(out, step);
  return out;
}
