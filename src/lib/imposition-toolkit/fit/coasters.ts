/* Coasters — gang layout.
 *
 * Round coaster on a 4 x 4" square piece — the die is round, the piece that has
 * to fit the sheet is its bounding square.
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

export const COASTER_W_IN = 4;
export const COASTER_H_IN = 4;
export const COASTER_SHEET_W_IN = 11;
export const COASTER_SHEET_H_IN = 17;

/** How this piece is actually produced on press — the thing that decides the
 *  gutter, and therefore the count. Round die — the cutter needs clearance between pieces, so NOT butt-cut. */
export const COASTER_DEFAULTS = {
  marginIn: 0.25,
  gutterXIn: 0.125,
  gutterYIn: 0.125,
  buttCut: false,
} as const;

export const COASTER_TOOL = 'coaster';

export function fitCoaster(
  spec: SheetSpec, pieceWIn = COASTER_W_IN, pieceHIn = COASTER_H_IN,
): SheetFit {
  return packBestOrientation({ ...COASTER_DEFAULTS, ...spec }, pieceWIn, pieceHIn, 'coaster');
}
