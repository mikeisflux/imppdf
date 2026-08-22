/* Postcards — gang layout.
 *
 * USPS-legal 6 x 4" postcard. Printed duplex (long-edge flip), so the back must
 * land in the same cell as the front.
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

export const POSTCARD_W_IN = 6;
export const POSTCARD_H_IN = 4;
export const POSTCARD_SHEET_W_IN = 8.5;
export const POSTCARD_SHEET_H_IN = 11;

/** How this piece is actually produced on press — the thing that decides the
 *  gutter, and therefore the count. Butt-cut. */
export const POSTCARD_DEFAULTS = {
  marginIn: 0.25,
  gutterXIn: 0,
  gutterYIn: 0,
  buttCut: true,
} as const;

export const POSTCARD_TOOL = 'postcard';

export function fitPostcard(
  spec: SheetSpec, pieceWIn = POSTCARD_W_IN, pieceHIn = POSTCARD_H_IN,
): SheetFit {
  return packBestOrientation({ ...POSTCARD_DEFAULTS, ...spec }, pieceWIn, pieceHIn, 'postcard');
}
