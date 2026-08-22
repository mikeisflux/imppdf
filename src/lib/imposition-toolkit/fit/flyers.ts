/* Flyers — gang layout.
 *
 * Full-page flyer. One per sheet at Letter; a larger sheet gangs more.
 *
 * The piece placed on the sheet is the TRIM size: cut marks sit outside it.
 * (Art Prints is the exception in this directory — its sizes include bleed.)
 *
 * Counts for the common sheets are asserted in test/fit-all-tools.test.ts,
 * which also checks that every placed cell lands inside the margins and that
 * no two overlap. If a change to the shared grid moves this tool's numbers,
 * that test fails naming this tool.                                        */

import type { SheetFit, SheetSpec } from './types.ts';
import { packBestOrientation } from './sheet-grid.ts';

export const FLYER_W_IN = 8.5;
export const FLYER_H_IN = 11;
export const FLYER_SHEET_W_IN = 8.5;
export const FLYER_SHEET_H_IN = 11;

/** How this piece is actually produced on press — the thing that decides the
 *  gutter, and therefore the count. Butt-cut; usually 1-up anyway. */
export const FLYER_DEFAULTS = {
  marginIn: 0.25,
  gutterXIn: 0,
  gutterYIn: 0,
  buttCut: true,
} as const;

export const FLYER_TOOL = 'flyer';

export function fitFlyer(
  spec: SheetSpec, pieceWIn = FLYER_W_IN, pieceHIn = FLYER_H_IN,
): SheetFit {
  return packBestOrientation({ ...FLYER_DEFAULTS, ...spec }, pieceWIn, pieceHIn, 'flyer');
}
