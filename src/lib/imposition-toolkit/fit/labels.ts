/* Labels — gang layout.
 *
 * General shipping/product label, 4 x 3.33".
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

export const LABEL_W_IN = 4;
export const LABEL_H_IN = 3.33;
export const LABEL_SHEET_W_IN = 8.5;
export const LABEL_SHEET_H_IN = 11;

/** How this piece is actually produced on press — the thing that decides the
 *  gutter, and therefore the count. Butt-cut sheet labels. */
export const LABEL_DEFAULTS = {
  marginIn: 0.25,
  gutterXIn: 0,
  gutterYIn: 0,
  buttCut: true,
} as const;

export const LABEL_TOOL = 'label';

export function fitLabel(
  spec: SheetSpec, pieceWIn = LABEL_W_IN, pieceHIn = LABEL_H_IN,
): SheetFit {
  return packBestOrientation({ ...LABEL_DEFAULTS, ...spec }, pieceWIn, pieceHIn, 'label');
}
