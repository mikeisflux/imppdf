/* Contact Frames — gang layout.
 *
 * Photo contact sheet frame, 3.75 x 2.4".
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

export const CONTACT_CELL_W_IN = 3.75;
export const CONTACT_CELL_H_IN = 2.4;
export const CONTACT_CELL_SHEET_W_IN = 8.5;
export const CONTACT_CELL_SHEET_H_IN = 11;

/** How this piece is actually produced on press — the thing that decides the
 *  gutter, and therefore the count. Frames butt together on the sheet. */
export const CONTACT_CELL_DEFAULTS = {
  marginIn: 0.25,
  gutterXIn: 0,
  gutterYIn: 0,
  buttCut: true,
} as const;

export const CONTACT_CELL_TOOL = 'contact';

export function fitContactCell(
  spec: SheetSpec, pieceWIn = CONTACT_CELL_W_IN, pieceHIn = CONTACT_CELL_H_IN,
): SheetFit {
  return packBestOrientation({ ...CONTACT_CELL_DEFAULTS, ...spec }, pieceWIn, pieceHIn, 'contact frame');
}
