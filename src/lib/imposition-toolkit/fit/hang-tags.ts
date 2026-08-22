/* Hang Tags — gang layout.
 *
 * Hang tag, 2.5 x 4". The string hole is punched after cutting, so it needs no
 * extra clearance in the layout.
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

export const HANG_TAG_W_IN = 2.5;
export const HANG_TAG_H_IN = 4;
export const HANG_TAG_SHEET_W_IN = 11;
export const HANG_TAG_SHEET_H_IN = 17;

/** How this piece is actually produced on press — the thing that decides the
 *  gutter, and therefore the count. Butt-cut, then the hole is punched. */
export const HANG_TAG_DEFAULTS = {
  marginIn: 0.25,
  gutterXIn: 0,
  gutterYIn: 0,
  buttCut: true,
} as const;

export const HANG_TAG_TOOL = 'hangtag';

export function fitHangTag(
  spec: SheetSpec, pieceWIn = HANG_TAG_W_IN, pieceHIn = HANG_TAG_H_IN,
): SheetFit {
  return packBestOrientation({ ...HANG_TAG_DEFAULTS, ...spec }, pieceWIn, pieceHIn, 'hang tag');
}
