/* Divinity trading cards — a standard 2.5 x 3.5" trading card, ganged on A4 and
 * doubled onto A3 so one sheet cuts in half into two identical A4s.
 *
 * The card is stated in INCHES because that is what "standard trading card"
 * means; the sheet is stated in MILLIMETRES because A-sizes are metric and the
 * gutter and margins come off the shop's spec sheet in mm. Both are exact:
 * 2.5" is 63.5 mm and 3.5" is 88.9 mm, no rounding either way.
 *
 * EIGHT TO AN A4, NOT NINE. A portrait A4 takes nine (3 x 3), and that is what
 * this file used to do — but the shop's guillotine cuts eight from an A4 and
 * feeds it LONG EDGE FIRST, so the A4 block is described 297 x 210 and holds
 * 4 across x 2 down. Owner instruction, and it matches divinity-deck.ts so both
 * tools come off the cutter the same way. The ninth card is not available at
 * this orientation and is not worth chasing:
 *
 *   297 x 210 sheet, 3 mm gutter, card UPRIGHT 63.5 x 88.9
 *     4 across = 4(63.5) + 3(3) = 263.0  <= 297     5 would need 329.5
 *     2 down   = 2(88.9) + 1(3) = 180.8  <= 210     3 would need 272.7
 *
 * Upright also means portrait artwork needs no quarter turn at all, so duplex
 * has one less thing to get wrong.
 *
 * The A3 is the A4 block STACKED, not set side by side: two 297 x 210 blocks
 * make 297 x 420, which is A3. Cut across at 210 and you have two A4s, each
 * correct on its own. (Side by side would need 594 mm and there is no such
 * sheet.)
 *
 * Reference numbers, asserted in test/fit-divinity-cards.test.ts:
 *
 *    A4 297 x 210  ->   8 cards, 4 across x 2 down, margins 17.00 / 14.60
 *    A3 297 x 420  ->  16 cards, the same block twice, cut line at 210
 */

export const MM_PER_IN = 25.4;
export const PT_PER_MM = 72 / MM_PER_IN;

/** Standard trading card: 2.5 x 3.5 inches. */
export const CARD_W_IN = 2.5;
export const CARD_H_IN = 3.5;
export const CARD_W_MM = CARD_W_IN * MM_PER_IN;   // 63.5
export const CARD_H_MM = CARD_H_IN * MM_PER_IN;   // 88.9

/** As PLACED on the sheet: upright, so no turn for portrait artwork. */
export const PLACED_W_MM = CARD_W_MM;
export const PLACED_H_MM = CARD_H_MM;

/** The shop's cutting allowance between cards, from the original spec sheet. */
export const GUTTER_MM = 3;

/** A4 fed LONG EDGE FIRST — the same paper as 210 x 297, described the other
 *  way, because that is how it goes through the bypass tray. A3 is two of those
 *  stacked, which is exactly 297 x 420. */
export const A4_W_MM = 297, A4_H_MM = 210;
export const A3_W_MM = 297, A3_H_MM = 420;

/** How many `size`-wide items fit across `span` with a gutter between each.
 *  n items need n*size + (n-1)*gutter, which rearranges to this. Worked rather
 *  than hard-coded so a size change can't leave a stale count behind. */
const fitCount = (span: number, size: number) =>
  Math.max(0, Math.floor((span + GUTTER_MM) / (size + GUTTER_MM)));

export const COLS = fitCount(A4_W_MM, PLACED_W_MM);   // 4
export const ROWS = fitCount(A4_H_MM, PLACED_H_MM);   // 2

export interface CardRectMm { xMm: number; yMm: number; wMm: number; hMm: number; }

export interface DivinityCardFit {
  /** Sheet actually used, in mm. */
  sheetWMm: number; sheetHMm: number;
  /** Every card position, origin BOTTOM-LEFT (PDF convention). */
  cells: CardRectMm[];
  /** Cards on the sheet. */
  n: number;
  /** Margin from the A4 block's own edges to the outermost card. */
  marginXMm: number; marginYMm: number;
  /** Where an A3 is cut into two A4s, as a y ACROSS the sheet. Empty for a
   *  plain A4. The blocks stack, so the cut is horizontal. */
  cutYMm: number[];
}

/** The positions inside ONE A4 block, lifted by `originYMm` on the sheet. */
function blockCells(originYMm: number, marginXMm: number, marginYMm: number): CardRectMm[] {
  const out: CardRectMm[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      out.push({
        xMm: marginXMm + c * (PLACED_W_MM + GUTTER_MM),
        /* Rows are numbered from the TOP of the block, the way a spec sheet
           reads, but PDF y runs up — so row 0 is the highest y. */
        yMm: originYMm + A4_H_MM - marginYMm - (r + 1) * PLACED_H_MM - r * GUTTER_MM,
        wMm: PLACED_W_MM, hMm: PLACED_H_MM,
      });
    }
  }
  return out;
}

export function fitDivinityCards(sheet: 'a4' | 'a3' = 'a3'): DivinityCardFit {
  const blockW = COLS * PLACED_W_MM + (COLS - 1) * GUTTER_MM;   // 263.0
  const blockH = ROWS * PLACED_H_MM + (ROWS - 1) * GUTTER_MM;   // 180.8
  /* Centred, and centred is what makes the grid back up: equal margins mean
     every card has a partner at the mirrored position, so the sheet registers
     with itself however the press turns it over. */
  const marginXMm = (A4_W_MM - blockW) / 2;                     // 17.00
  const marginYMm = (A4_H_MM - blockH) / 2;                     // 14.60

  if (sheet === 'a4') {
    return {
      sheetWMm: A4_W_MM, sheetHMm: A4_H_MM,
      cells: blockCells(0, marginXMm, marginYMm),
      n: COLS * ROWS, marginXMm, marginYMm, cutYMm: [],
    };
  }
  return {
    sheetWMm: A3_W_MM, sheetHMm: A3_H_MM,
    /* Bottom block first, then the one stacked on top of it, so the cells still
       read in a sensible order down the sheet. */
    cells: [...blockCells(A4_H_MM, marginXMm, marginYMm), ...blockCells(0, marginXMm, marginYMm)],
    n: 2 * COLS * ROWS, marginXMm, marginYMm, cutYMm: [A4_H_MM],
  };
}
