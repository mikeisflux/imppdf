/* Divinity trading cards — one card artwork ganged on A4 and the block
 * duplicated onto A3, so one A3 cuts in half into two identical A4s to run.
 *
 * THIS IS THE CUT MACHINE'S TEMPLATE, and it is the same template as
 * fit/divinity-deck.ts so both tools cut identically. It is built from the two
 * things the owner measured with a ruler on the machine's own output:
 *
 *   the CUT CARD   89 x 63 mm   (a 2.5 x 3.5" card after the blade)
 *   the GUTTERS    10 mm between the columns, 3 mm between the rows
 *
 * Those are the INPUT; the margins are the remainder and cannot be set
 * independently.
 *
 *   across   11 + 89 + 10 + 89 + 11                  = 210
 *   down     18 + 63 + 3 + 63 + 3 + 63 + 3 + 63 + 18 = 297
 *
 * The cards LIE SIDEWAYS: the 89 mm edge runs across the portrait sheet, 2
 * across x 4 down = 8. The artwork is 88.9 x 63.5 placed that way, so cover-fit
 * loses about 0.5 mm off the height and nothing off the width.
 *
 * The A3 is that block twice, side by side (420 x 297), cut down at 210 so each
 * half is a whole A4 carrying its own 11 mm margins.
 *
 * Reference numbers, asserted in test/fit-divinity-cards.test.ts:
 *
 *    A4 210 x 297  ->   8 cards, 2 across x 4 down, cell 89 x 63
 *    A3 420 x 297  ->  16 cards, the same block twice, cut down at 210
 */

export const MM_PER_IN = 25.4;
export const PT_PER_MM = 72 / MM_PER_IN;

/** The artwork's nominal size — a standard 2.5 x 3.5" card. Stated for
 *  comparison only; PLACED_W_MM / PLACED_H_MM below are what get used. */
export const CARD_W_IN = 2.5;
export const CARD_H_IN = 3.5;
export const CARD_W_MM = CARD_W_IN * MM_PER_IN;   // 63.5
export const CARD_H_MM = CARD_H_IN * MM_PER_IN;   // 88.9

/** A4 PORTRAIT, and A3 as two of those side by side. */
export const A4_W_MM = 210, A4_H_MM = 297;
export const A3_W_MM = 420, A3_H_MM = 297;

/* ── Measured off the cut machine. Change these only with a ruler. ────────── */
/** The cell as the blade leaves it: sideways, long edge across the sheet. */
export const PLACED_W_MM = 89;
export const PLACED_H_MM = 63;
export const GUTTER_X_MM = 10;
export const GUTTER_Y_MM = 3;
export const COLS = 2;
export const ROWS = 4;

/** The remainder, worked rather than restated. */
export const MARGIN_X_MM = (A4_W_MM - COLS * PLACED_W_MM - (COLS - 1) * GUTTER_X_MM) / 2;  // 11
export const MARGIN_Y_MM = (A4_H_MM - ROWS * PLACED_H_MM - (ROWS - 1) * GUTTER_Y_MM) / 2;  // 18

export interface CardRectMm { xMm: number; yMm: number; wMm: number; hMm: number; }

export interface DivinityCardFit {
  /** Sheet actually used, in mm. */
  sheetWMm: number; sheetHMm: number;
  /** Every card position, origin BOTTOM-LEFT (PDF convention). */
  cells: CardRectMm[];
  /** Cards on the sheet. */
  n: number;
  /** Margin from the A4 block's own edges to the outermost cut line. */
  marginXMm: number; marginYMm: number;
  /** Where an A3 is cut into two A4s, as an x DOWN the sheet. Empty for a plain
   *  A4. The blocks sit side by side, so the cut is vertical. */
  cutXMm: number[];
}

/** The positions inside ONE A4 block, offset by `originXMm` on the sheet. */
function blockCells(originXMm: number): CardRectMm[] {
  const out: CardRectMm[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      out.push({
        xMm: originXMm + MARGIN_X_MM + c * (PLACED_W_MM + GUTTER_X_MM),
        /* Rows are numbered from the TOP of the sheet, the way a spec sheet
           reads, but PDF y runs up — so row 0 is the highest y. */
        yMm: A4_H_MM - MARGIN_Y_MM - (r + 1) * PLACED_H_MM - r * GUTTER_Y_MM,
        wMm: PLACED_W_MM, hMm: PLACED_H_MM,
      });
    }
  }
  return out;
}

export function fitDivinityCards(sheet: 'a4' | 'a3' = 'a3'): DivinityCardFit {
  if (sheet === 'a4') {
    return {
      sheetWMm: A4_W_MM, sheetHMm: A4_H_MM, cells: blockCells(0),
      n: COLS * ROWS, marginXMm: MARGIN_X_MM, marginYMm: MARGIN_Y_MM, cutXMm: [],
    };
  }
  return {
    sheetWMm: A3_W_MM, sheetHMm: A3_H_MM,
    cells: [...blockCells(0), ...blockCells(A4_W_MM)],
    n: 2 * COLS * ROWS, marginXMm: MARGIN_X_MM, marginYMm: MARGIN_Y_MM, cutXMm: [A4_W_MM],
  };
}
