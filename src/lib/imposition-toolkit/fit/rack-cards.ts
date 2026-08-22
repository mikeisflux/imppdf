/* Rack Cards — gang layout.
 *
 * Rack card sized for a standard brochure holder, 4 x 9".
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

export const RACK_CARD_W_IN = 4;
export const RACK_CARD_H_IN = 9;
export const RACK_CARD_SHEET_W_IN = 11;
export const RACK_CARD_SHEET_H_IN = 17;

/** How this piece is actually produced on press — the thing that decides the
 *  gutter, and therefore the count. Butt-cut. */
export const RACK_CARD_DEFAULTS = {
  marginIn: 0.25,
  gutterXIn: 0,
  gutterYIn: 0,
  buttCut: true,
} as const;

export const RACK_CARD_TOOL = 'rackcard';

export function fitRackCard(
  spec: SheetSpec, pieceWIn = RACK_CARD_W_IN, pieceHIn = RACK_CARD_H_IN,
): SheetFit {
  return packBestOrientation({ ...RACK_CARD_DEFAULTS, ...spec }, pieceWIn, pieceHIn, 'rack card');
}
