/* Perfect bound book block — CUT AND STACK, printed duplex.
 *
 * This is the opposite of a booklet and the distinction is the whole tool:
 *
 *   Booklet   — sheets are FOLDED. Page order follows the fold.
 *   Perfect   — sheets are CUT into piles and the piles are STACKED. Page order
 *               follows the stack: cell 0 holds pages 1..S of a run of S sheets,
 *               cell 1 holds the next S, and so on. Cut, drop one pile on the
 *               next, and the book is in order.
 *
 * Duplex: page 2 backs page 1 (owner's words). So sheets pair up as
 * front/back and the back side mirrors the column order, or the back lands
 * behind the wrong front on a long-edge flip.
 *
 * itemAt = cellIdx * numSheets + sheetIdx — that single expression is what
 * makes it cut-and-stack rather than sequential.
 *
 * Asserted in test/fit-bound.test.ts.                                       */

import type { SheetFit, SheetSpec } from './types.ts';
import { packBestOrientation } from './sheet-grid.ts';

export const PERFECT_DEFAULT_TRIM_W_IN = 6;
export const PERFECT_DEFAULT_TRIM_H_IN = 9;

export const PERFECT_DEFAULTS = {
  marginIn: 0.25, gutterXIn: 0.125, gutterYIn: 0.125, buttCut: false,
} as const;

/** Which page lands in a given cell on a given sheet. Cut-and-stack. */
export function perfectItemAt(cellIdx: number, sheetIdx: number, numSheets: number): number {
  return cellIdx * numSheets + sheetIdx;
}

/** Sheets needed for a page count at N-up, duplex (2 sides per sheet). */
export function perfectSheets(pageCount: number, upPerSide: number): number {
  return Math.ceil(Math.ceil(pageCount) / Math.max(1, upPerSide * 2));
}

export function fitPerfectBound(
  spec: SheetSpec, trimWIn = PERFECT_DEFAULT_TRIM_W_IN, trimHIn = PERFECT_DEFAULT_TRIM_H_IN,
): SheetFit {
  const f = packBestOrientation({ ...PERFECT_DEFAULTS, ...spec }, trimWIn, trimHIn, 'book page');
  return { ...f, why: f.fits
    ? `${f.n} pages per side (${f.cols}×${f.rows}), printed duplex so page 2 backs page 1. `
      + 'Cut into piles and stack: cell order is the stack order, not the reading order.'
    : f.why };
}
