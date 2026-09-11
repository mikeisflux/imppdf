/* Divinity trading cards — one card artwork ganged 8-up on A4 and the block
 * duplicated onto A3, so one A3 cuts in half into two identical A4s to run.
 *
 * THE CARD SIZE IS THE INPUT. A trading card is 2.5 x 3.5 inches and nothing
 * else; that is the product. Placed sideways the cell is 88.9 x 63.5 exactly,
 * so the artwork needs no scaling and loses nothing.
 *
 * The GUTTERS are measured off the shop's cut machine — 10 between the columns,
 * 3 between the rows — as is the 6.5 head margin. THE OUTER MARGINS ARE THE
 * REMAINDER: eight gaps and a card size cannot all be chosen at once, and the
 * margins are the right thing to give because they are WASTE.
 *
 *   across  11.1 + 88.9 + 10 + 88.9 + 11.1  = 210
 *   down    6.5 + 4(63.5) + 3(3) + 27.5       = 297
 *
 * Same template as fit/divinity-deck.ts, asserted so the two cannot drift.
 * The block is PINNED TO THE HEAD, so the sheet backs up on a LONG-EDGE flip
 * but not end-for-end.
 *
 *    A4 210 x 297  ->   8 cards, 2 across x 4 down, cell 88.9 x 63.5
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

/** The cell IS the card, laid sideways. Never derived, never adjusted to make a
 *  margin come out — a card that is not 2.5 x 3.5 is not a trading card. */
export const PLACED_W_MM = CARD_H_MM;             // 88.9
export const PLACED_H_MM = CARD_W_MM;             // 63.5

/* ── Measured off the cut machine. Change these only with a ruler. ────────── */
/** B — between the two columns. */
export const GUTTER_X_MM = 10;
/** D — sheet edge to the first cut line at the head. Not more, not less. */
export const MARGIN_TOP_MM = 6.5;
/** E, F and G — between the rows. NOT the same as the column gutter. */
export const GUTTER_Y_MM = 3;

export const COLS = 2;
export const ROWS = 4;

/* ── The waste. Worked, never stated. ─────────────────────────────────────── */
export const MARGIN_X_MM =
  (A4_W_MM - COLS * PLACED_W_MM - (COLS - 1) * GUTTER_X_MM) / 2;                        // 11.1
export const MARGIN_BOTTOM_MM =
  A4_H_MM - MARGIN_TOP_MM - ROWS * PLACED_H_MM - (ROWS - 1) * GUTTER_Y_MM;              // 27.5

export interface CardRectMm { xMm: number; yMm: number; wMm: number; hMm: number; }

export interface DivinityCardFit {
  /** Sheet actually used, in mm. */
  sheetWMm: number; sheetHMm: number;
  /** Every card position, origin BOTTOM-LEFT (PDF convention). */
  cells: CardRectMm[];
  /** Cards on the sheet. */
  n: number;
  /** Margin from the A4 block's own edges to the outermost cut line. The block
   *  is pinned to the head, so top and bottom are not the same. */
  marginXMm: number; marginTopMm: number; marginBottomMm: number;
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
        yMm: A4_H_MM - MARGIN_TOP_MM - (r + 1) * PLACED_H_MM - r * GUTTER_Y_MM,
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
      n: COLS * ROWS, marginXMm: MARGIN_X_MM,
      marginTopMm: MARGIN_TOP_MM, marginBottomMm: MARGIN_BOTTOM_MM, cutXMm: [],
    };
  }
  return {
    sheetWMm: A3_W_MM, sheetHMm: A3_H_MM,
    cells: [...blockCells(0), ...blockCells(A4_W_MM)],
    n: 2 * COLS * ROWS, marginXMm: MARGIN_X_MM,
    marginTopMm: MARGIN_TOP_MM, marginBottomMm: MARGIN_BOTTOM_MM, cutXMm: [A4_W_MM],
  };
}
