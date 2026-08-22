/* Index cards — 3 × 5" cards ganged on a sheet.
 *
 * The card has no bleed: it is a plain white card trimmed on all four sides,
 * so the piece placed on the sheet is exactly the trim size.
 *
 * Reference numbers this tool is expected to produce, with the default 0.25"
 * margin, 0.125" gutter and cut marks on:
 *
 *    11 × 17 tabloid  →   9 cards, 3 across × 3 down  (11/3 = 3, 17/5 = 3)
 *    17 × 11 tabloid  →  10 cards, 5 across × 2 down  (17/3 = 5, 11/5 = 2)
 *    8.5 × 11 letter  →   4 cards, 2 across × 2 down
 *
 * They are asserted in test/fit-index-cards.test.ts. If a change to the shared
 * grid moves any of them, that test fails and names the tool — which is the
 * whole reason these live in separate files.                                */

import type { SheetFit, SheetSpec } from './types.ts';
import { packBestOrientation } from './sheet-grid.ts';

/* 3 wide x 5 tall, and TURNED when that yields more — with the turn stated.
 *
 * On 11 x 17 the two layouts are:
 *     upright   3 across x 3 down =  9   (11/3 = 3, 17/5 = 3)
 *     turned    2 across x 5 down = 10   (11/5 = 2, 17/3 = 5)
 * Ten is the maximum, so the card is turned. Both fit inside the sheet; the
 * difference is only which side of the card runs down it.
 *
 * The old panel wording is what made this look like nonsense: it said the cell
 * was 3 x 5 and the grid was "2 x 5", which reads as 2 across by 5 down of a
 * 5"-TALL card — 6 x 25", impossible on a 17" sheet. The layout was right and
 * the sentence was wrong. It now names the placed size and the turn. */
export const INDEX_CARD_W_IN = 3;
export const INDEX_CARD_H_IN = 5;

/** How index cards are actually produced, and the orientation rule above.
 *  Butt-cut: guillotined in a stack, one cut serving both cards either side. */
export const INDEX_CARD_DEFAULTS = {
  marginIn: 0.25,
  gutterXIn: 0,
  gutterYIn: 0,
  buttCut: true,
} as const;

export function fitIndexCards(
  spec: SheetSpec, cardWIn = INDEX_CARD_W_IN, cardHIn = INDEX_CARD_H_IN,
): SheetFit {
  return packBestOrientation({ ...INDEX_CARD_DEFAULTS, ...spec }, cardWIn, cardHIn, 'card');
}
