/* Compliment Slips — gang layout.
 *
 * DL compliments slip, 210 x 99mm (8.27 x 3.9"), on SRA4.
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

export const COMP_SLIP_W_IN = 8.27;
export const COMP_SLIP_H_IN = 3.9;
export const COMP_SLIP_SHEET_W_IN = 8.86;
export const COMP_SLIP_SHEET_H_IN = 12.6;

/** How this piece is actually produced on press — the thing that decides the
 *  gutter, and therefore the count. Butt-cut. */
export const COMP_SLIP_DEFAULTS = {
  marginIn: 0.25,
  gutterXIn: 0,
  gutterYIn: 0,
  buttCut: true,
} as const;

export const COMP_SLIP_TOOL = 'compslip';

export function fitCompSlip(
  spec: SheetSpec, pieceWIn = COMP_SLIP_W_IN, pieceHIn = COMP_SLIP_H_IN,
): SheetFit {
  return packBestOrientation({ ...COMP_SLIP_DEFAULTS, ...spec }, pieceWIn, pieceHIn, 'compliment slip');
}
