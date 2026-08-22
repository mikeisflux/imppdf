/* The shared arithmetic, and NOTHING about any particular tool.

   Every rule here is true of any sheet of paper. Anything that is true only of
   index cards, or only of art prints, belongs in that tool's own file — that
   separation is the entire point of this directory (see types.ts). */

import type { SheetFit, SheetSpec } from './types.ts';

/** A mark shorter than this is not worth drawing, so it is the least clearance
 *  worth reserving at the sheet edge. */
export const MIN_MARK_IN = 0.08;

/** Clearance cut marks need, which is NOT the same at the sheet edge as it is
 *  between two pieces.
 *
 *  At the OUTER EDGE the mark has nowhere to go but the margin: it needs the
 *  offset, plus enough length to be visible. The mark is then clipped to the
 *  margin — growing the margin to the full mark length instead would let a
 *  0.43" mark demand a 0.555" margin and cost an entire column.
 *
 *  BETWEEN TWO PIECES the marks either side of the trim are COLLINEAR: they lie
 *  on the same line and merge into one cut line, exactly as on any gang sheet.
 *  Each only has to clear its neighbour's artwork, so twice the offset is
 *  enough. Reserving offset + length here reserves a full mark length twice
 *  over, for a line that gets drawn once. */
export function markClearanceIn(spec: SheetSpec): { marginIn: number; gutterIn: number } {
  if (!spec.addMarks) return { marginIn: 0, gutterIn: 0 };
  const off = Math.max(0, spec.markOffIn ?? 0.125);
  const len = Math.max(0, spec.markLenIn ?? 0.43);
  return { marginIn: off + Math.min(len, MIN_MARK_IN), gutterIn: 2 * off };
}

/** How many cells of a given size fit, once margins, gutters and mark
 *  clearance are taken out. No rotation, no policy — just the count. */
export function packCells(spec: SheetSpec, cellWIn: number, cellHIn: number): {
  cols: number; rows: number; marginIn: number; gutterXIn: number; gutterYIn: number; fits: boolean;
} {
  const clear = markClearanceIn(spec);
  const marginIn = Math.max(spec.marginIn ?? 0, clear.marginIn);
  const gutterXIn = Math.max(spec.gutterXIn ?? 0, clear.gutterIn);
  const gutterYIn = Math.max(spec.gutterYIn ?? 0, clear.gutterIn);
  const usableW = spec.sheetWIn - 2 * marginIn;
  const usableH = spec.sheetHIn - 2 * marginIn;
  const fits = cellWIn <= usableW + 1e-6 && cellHIn <= usableH + 1e-6;
  // +gutter on both sides of the division: N cells have only N-1 gutters.
  const cols = Math.max(1, Math.floor((usableW + gutterXIn) / (cellWIn + gutterXIn) + 1e-6));
  const rows = Math.max(1, Math.floor((usableH + gutterYIn) / (cellHIn + gutterYIn) + 1e-6));
  return { cols, rows, marginIn, gutterXIn, gutterYIn, fits };
}

/** Pack a piece, turning it 90° when that fits more per sheet.
 *  CLAUDE.md: never assume a count, and rotate when rotating fits more. */
export function packBestOrientation(
  spec: SheetSpec, pieceWIn: number, pieceHIn: number, label: string,
): SheetFit {
  const upright = packCells(spec, pieceWIn, pieceHIn);
  const turned = packCells(spec, pieceHIn, pieceWIn);
  const canTurn = spec.autoRotate !== false;
  const rotated = canTurn && turned.cols * turned.rows > upright.cols * upright.rows;
  const g = rotated ? turned : upright;
  const cellWIn = rotated ? pieceHIn : pieceWIn;
  const cellHIn = rotated ? pieceWIn : pieceHIn;
  const n = g.cols * g.rows;

  const size = `${round(cellWIn)}×${round(cellHIn)}"`;
  const why = !g.fits
    ? `A single ${round(pieceWIn)}×${round(pieceHIn)}" ${label} does not fit a `
      + `${round(spec.sheetWIn)}×${round(spec.sheetHIn)}" sheet inside a ${round(g.marginIn)}" margin.`
    : `${n} per sheet (${g.cols}×${g.rows}). Each ${label} takes ${size}`
      + `${rotated ? ', turned 90° because that fits more' : ''}, `
      + `with a ${round(g.marginIn)}" margin and ${round(g.gutterXIn)}" between pieces`
      + `${spec.addMarks ? ' (enough for the cut marks — marks either side of a trim share one line)' : ''}.`;

  return {
    cols: g.cols, rows: g.rows, n,
    marginIn: g.marginIn, gutterXIn: g.gutterXIn, gutterYIn: g.gutterYIn,
    cellWIn, cellHIn, rotated, fits: g.fits, why,
  };
}

function round(v: number): string {
  return Number(v.toFixed(3)).toString();
}
