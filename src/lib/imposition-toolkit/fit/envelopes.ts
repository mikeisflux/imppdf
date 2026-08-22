/* Envelope Flats — gang layout.
 *
 * #10 envelope printed FLAT, 9.5 x 4.125", folded and gummed afterwards.
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

export const ENVELOPE_W_IN = 9.5;
export const ENVELOPE_H_IN = 4.125;
export const ENVELOPE_SHEET_W_IN = 11;
export const ENVELOPE_SHEET_H_IN = 17;

/** How this piece is actually produced on press — the thing that decides the
 *  gutter, and therefore the count. Die-cut flat with flaps — needs die clearance. */
export const ENVELOPE_DEFAULTS = {
  marginIn: 0.25,
  gutterXIn: 0.125,
  gutterYIn: 0.125,
  buttCut: false,
} as const;

export const ENVELOPE_TOOL = 'envelope';

export function fitEnvelope(
  spec: SheetSpec, pieceWIn = ENVELOPE_W_IN, pieceHIn = ENVELOPE_H_IN,
): SheetFit {
  return packBestOrientation({ ...ENVELOPE_DEFAULTS, ...spec }, pieceWIn, pieceHIn, 'envelope flat');
}
