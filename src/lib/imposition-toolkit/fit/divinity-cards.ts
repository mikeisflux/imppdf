/* Divinity trading cards — a standard 2.5 x 3.5" trading card, ganged on A4 and
 * doubled onto A3 so one sheet cuts in half into two identical A4s.
 *
 * The card is stated in INCHES because that is what "standard trading card"
 * means; the sheet is stated in MILLIMETRES because A-sizes are metric and the
 * gutter and margins come off the shop's spec sheet in mm. Both are exact:
 * 2.5" is 63.5 mm and 3.5" is 88.9 mm, no rounding either way.
 *
 * HOW MANY FIT, with the 3 mm gutter. Worked both ways round rather than
 * assumed, because the answer is not the obvious one:
 *
 *   portrait  63.5 x 88.9   3 across = 3(63.5) + 2(3) = 196.5  <= 210
 *                           3 down   = 3(88.9) + 2(3) = 272.7  <= 297   ->  9
 *   landscape 88.9 x 63.5   2 across = 2(88.9) + 1(3) = 180.8  <= 210
 *                           4 down   = 4(63.5) + 3(3) = 263.0  <= 297   ->  8
 *
 * Nine beats eight, so the card stands UPRIGHT on the sheet — which also means
 * portrait artwork needs no quarter turn at all, and duplex has one less thing
 * to get wrong. A fourth row would need 355.6 mm of a 297 mm sheet; a fourth
 * column 263 mm of a 210 mm one. Neither is close.
 *
 * Reference numbers, asserted in test/fit-divinity-cards.test.ts:
 *
 *    A4 210 x 297  ->   9 cards, 3 across x 3 down, margins 6.75 / 12.15
 *    A3 420 x 297  ->  18 cards, the same block twice, cut line at 210
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

export const COLS = 3;
export const ROWS = 3;
/** The shop's cutting allowance between cards, from the original spec sheet. */
export const GUTTER_MM = 3;

export const A4_W_MM = 210, A4_H_MM = 297;
export const A3_W_MM = 420, A3_H_MM = 297;      // two A4 portraits side by side

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
  /** Where an A3 is cut into two A4s. Empty for a plain A4. */
  cutXMm: number[];
}

/** The positions inside ONE A4 block, offset by `originXMm` on the sheet. */
function blockCells(originXMm: number, marginXMm: number, marginYMm: number): CardRectMm[] {
  const out: CardRectMm[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      out.push({
        xMm: originXMm + marginXMm + c * (PLACED_W_MM + GUTTER_MM),
        /* Rows are numbered from the TOP of the sheet, the way a spec sheet
           reads, but PDF y runs up — so row 0 is the highest y. */
        yMm: A4_H_MM - marginYMm - (r + 1) * PLACED_H_MM - r * GUTTER_MM,
        wMm: PLACED_W_MM, hMm: PLACED_H_MM,
      });
    }
  }
  return out;
}

export function fitDivinityCards(sheet: 'a4' | 'a3' = 'a3'): DivinityCardFit {
  const blockW = COLS * PLACED_W_MM + (COLS - 1) * GUTTER_MM;   // 196.5
  const blockH = ROWS * PLACED_H_MM + (ROWS - 1) * GUTTER_MM;   // 272.7
  /* Centred, and centred is what makes the grid back up: equal margins mean
     every card has a partner at the mirrored position, so the sheet registers
     with itself however the press turns it over. */
  const marginXMm = (A4_W_MM - blockW) / 2;                     // 6.75
  const marginYMm = (A4_H_MM - blockH) / 2;                     // 12.15

  if (sheet === 'a4') {
    return {
      sheetWMm: A4_W_MM, sheetHMm: A4_H_MM,
      cells: blockCells(0, marginXMm, marginYMm),
      n: COLS * ROWS, marginXMm, marginYMm, cutXMm: [],
    };
  }
  return {
    sheetWMm: A3_W_MM, sheetHMm: A3_H_MM,
    cells: [...blockCells(0, marginXMm, marginYMm), ...blockCells(A4_W_MM, marginXMm, marginYMm)],
    n: 2 * COLS * ROWS, marginXMm, marginYMm, cutXMm: [A4_W_MM],
  };
}
