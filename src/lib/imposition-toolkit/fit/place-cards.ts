/* Place Cards — gang layout.
 *
 * Folded place card, 3.5 x 2" flat. It folds after cutting, so the piece on the
 * sheet is the flat size.
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

export const PLACE_CARD_W_IN = 3.5;
export const PLACE_CARD_H_IN = 2;
export const PLACE_CARD_SHEET_W_IN = 8.5;
export const PLACE_CARD_SHEET_H_IN = 11;

/** How this piece is actually produced on press — the thing that decides the
 *  gutter, and therefore the count. Butt-cut; the fold happens after trimming. */
export const PLACE_CARD_DEFAULTS = {
  marginIn: 0.25,
  gutterXIn: 0,
  gutterYIn: 0,
  buttCut: true,
} as const;

export const PLACE_CARD_TOOL = 'placecard';

export function fitPlaceCard(
  spec: SheetSpec, pieceWIn = PLACE_CARD_W_IN, pieceHIn = PLACE_CARD_H_IN,
): SheetFit {
  return packBestOrientation({ ...PLACE_CARD_DEFAULTS, ...spec }, pieceWIn, pieceHIn, 'place card');
}
