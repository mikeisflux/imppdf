/* Index cards — 3 × 5" cards ganged on a sheet.
 *
 * The card has no bleed: it is a plain white card trimmed on all four sides,
 * so the piece placed on the sheet is exactly the trim size.
 *
 * Reference numbers this tool is expected to produce, with the default 0.25"
 * margin, 0.125" gutter and cut marks on:
 *
 *    17 × 11 tabloid  →  10 cards, 5 × 2
 *    11 × 17 tabloid  →  10 cards, 2 × 5
 *    8.5 × 11 letter  →   4 cards, 2 × 2
 *
 * They are asserted in test/fit-index-cards.test.ts. If a change to the shared
 * grid moves any of them, that test fails and names the tool — which is the
 * whole reason these live in separate files.                                */

import type { SheetFit, SheetSpec } from './types.ts';
import { packBestOrientation } from './sheet-grid.ts';

export const INDEX_CARD_W_IN = 3;
export const INDEX_CARD_H_IN = 5;

export function fitIndexCards(
  spec: SheetSpec, cardWIn = INDEX_CARD_W_IN, cardHIn = INDEX_CARD_H_IN,
): SheetFit {
  return packBestOrientation(spec, cardWIn, cardHIn, 'card');
}
