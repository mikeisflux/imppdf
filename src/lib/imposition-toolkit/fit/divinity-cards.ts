/* Divinity trading cards — the shop's own card template, worked in MILLIMETRES.
 *
 * From the printer's spec sheet:
 *
 *        |<--------------- 210 --------------->|
 *        | 12 |    93     |     93     |  12   |      A4, portrait
 *             |    90     |     90     |              card is 90 wide
 *        ---  +-----------+------------+
 *      57|54  |           |            |               5 rows down
 *        ---  +-----------+------------+
 *                    ... x5 ...                        297 tall
 *
 * So the card lies on its SIDE: the artwork is 54 x 90 but it is placed
 * 90 across by 54 down. Ten to an A4, and the A4 block is doubled onto an A3
 * so one sheet yields twenty and cuts in half into two A4s.
 *
 * Everything here is stated in mm because that is how the spec is written and
 * how the shop measures. Converting to inches first and back would introduce
 * rounding into numbers that are exact by definition — 93 - 90 = 3, not 2.9998.
 *
 * Reference numbers, asserted in test/fit-divinity-cards.test.ts:
 *
 *    A4 210 x 297  ->  10 cards, 2 across x 5 down, margins 13.5 / 7.5
 *    A3 420 x 297  ->  20 cards, the same block twice, cut line at 210
 */

export const MM_PER_IN = 25.4;
export const PT_PER_MM = 72 / MM_PER_IN;

/** The card as ARTWORK: portrait, 54 wide by 90 tall. */
export const CARD_W_MM = 54;
export const CARD_H_MM = 90;

/** The card as PLACED on the sheet: turned, so 90 across by 54 down. */
export const PLACED_W_MM = CARD_H_MM;   // 90
export const PLACED_H_MM = CARD_W_MM;   // 54

export const COLS = 2;
export const ROWS = 5;
/** 93 - 90 across, 57 - 54 down. The spec gives the pitch; this is the gap. */
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
  /** Margin from the sheet edge to the outermost card, per A4 block. */
  marginXMm: number; marginYMm: number;
  /** Where an A3 is cut into two A4s. Empty for a plain A4. */
  cutXMm: number[];
}

/** The ten positions inside ONE A4 block, offset by `originXMm` on the sheet. */
function blockCells(originXMm: number, marginXMm: number, marginYMm: number): CardRectMm[] {
  const out: CardRectMm[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      out.push({
        xMm: originXMm + marginXMm + c * (PLACED_W_MM + GUTTER_MM),
        /* Rows are numbered from the TOP of the sheet, the way the spec sheet
           reads, but PDF y runs up — so row 0 is the highest y. */
        yMm: A4_H_MM - marginYMm - (r + 1) * PLACED_H_MM - r * GUTTER_MM,
        wMm: PLACED_W_MM, hMm: PLACED_H_MM,
      });
    }
  }
  return out;
}

export function fitDivinityCards(sheet: 'a4' | 'a3' = 'a3'): DivinityCardFit {
  const blockW = COLS * PLACED_W_MM + (COLS - 1) * GUTTER_MM;   // 183
  const blockH = ROWS * PLACED_H_MM + (ROWS - 1) * GUTTER_MM;   // 282
  // Centred in an A4, and the A3 is two A4s so each block centres in its half.
  const marginXMm = (A4_W_MM - blockW) / 2;                     // 13.5
  const marginYMm = (A4_H_MM - blockH) / 2;                     // 7.5

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
