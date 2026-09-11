/* Divinity trading cards — one card artwork ganged 8-up on A4 and the block
 * duplicated onto A3, so one A3 cuts in half into two identical A4s to run.
 *
 * THE CELL IS THE CARD PLUS 1.5 mm, laid sideways: 90.4 x 65. A 2.5 x 3.5"
 * card is 88.9 x 63.5, and the shop cuts it 1.5 over on each dimension — the
 * cell size is the CUT size, stated by the operator off the machine. Never
 * derived and never nudged to make a margin come out: a cell that is not the
 * cut size cuts cards that are the wrong size.
 *
 * B IS 7 — a real gap down the middle, measured off the machine. The ROWS still
 * touch and share one cut line; the columns do not.
 *
 * EVERY GAP IS A SETTING, and C and H can be typed as readily as A and D — they
 * are the far end of the same two spans, so entering one just places the block
 * from that edge instead. There is still only ONE degree of freedom per axis:
 * A + block + C must equal the sheet.
 *
 * THE VALIDATED TEMPLATE, measured off PRODUCTION stock and confirmed on a cut
 * stack:
 *
 *     A 14   B 7   D 8   sheet LETTER      (there is no row gutter)
 *     C and H then fall out at 14.10 and 11.40.
 *
 *     across  14 + 90.4 + 7 + 90.4 + 14.1 = 215.9
 *     down    8 + 4(65)                   + 11.4 = 279.4
 *
 * EVERY GAP IS 1.5 SMALLER THAN THE RULER READING, because the ruler reads the
 * paper between the ART and the art runs 1.5 past the cut. The CUT LINES are
 * what these numbers place, and they sit 1.5 inside the ink on every side.
 *
 * THE BLEED IS BUILT IN — there is no bleed control any more. The art is always
 * laid 1.5 mm past the cut on all four sides; it is not an option because a card
 * without it cuts white edges, which is the fault this template was rebuilt to
 * remove.
 *
 * THE ROWS BUTT — no gutter down the sheet at all. One cut line serves both
 * cards, and the 1.5 mm bleed laps onto the neighbour, which is the same
 * artwork.
 *
 * A IS NOT EQUAL TO C, and that is not a mistake. An earlier set (A 14, D 6.5,
 * with 3 mm between the rows) was validated on TEST stock and did not hold when
 * the real card stock went in — heavier stock registers differently through the
 * machine. These numbers describe where the machine actually cuts; they are not
 * derived from any rule, and re-centring them breaks the template.
 *
 * ART BLEEDS PAST THE TRIM and is meant to spill into the gutters; that is what
 * a bleed is for. Bleed is drawn OUTSIDE the cell, so it never enters the sum
 * and never moves a cut line. Where two bleeds cross they cross with the same
 * artwork — every card on the sheet is the same card — and the blade takes it
 * away.
 */

export const MM_PER_IN = 25.4;
export const PT_PER_MM = 72 / MM_PER_IN;

/** The artwork's nominal size — a standard 2.5 x 3.5" card. Stated for
 *  comparison only; PLACED_W_MM / PLACED_H_MM below are what get used. */
export const CARD_W_IN = 2.5;
export const CARD_H_IN = 3.5;
export const CARD_W_MM = CARD_W_IN * MM_PER_IN;   // 63.5
export const CARD_H_MM = CARD_H_IN * MM_PER_IN;   // 88.9

/* ── The sheets. LETTER is the default because it is what is in the shop's
   tray: 8.5 x 11 is 215.9 x 279.4, and an A4 page is 17.6 mm TALLER than that.
   Sending A4 to a Letter tray is what put the top row off the sheet — the file
   measured a correct A4 all the way through and the paper was never A4.

   It is also the sheet the production template closes on, to the millimetre:
     across  A 14 + 90.4 + B 7 + 90.4 + C 14.1 = 215.9
     down    D 8  + 4(65)              + H 11.4 = 279.4                     */
export const LETTER_W_MM = 8.5 * MM_PER_IN;    // 215.9
export const LETTER_H_MM = 11 * MM_PER_IN;     // 279.4
export const TABLOID_W_MM = 17 * MM_PER_IN;    // 431.8 — two Letters side by side
export const A4_W_MM = 210, A4_H_MM = 297;
export const A3_W_MM = 420, A3_H_MM = 297;

/** 'letter' / 'a4' hold one block; 'tabloid' / 'a3' hold two side by side and
 *  cut down the middle into two of the smaller sheet. */
export type DivinityCardSheet = 'letter' | 'tabloid' | 'a4' | 'a3';

interface SheetSpec { wMm: number; hMm: number; blockWMm: number; doubled: boolean; }
const SHEETS: Record<DivinityCardSheet, SheetSpec> = {
  letter:  { wMm: LETTER_W_MM,  hMm: LETTER_H_MM, blockWMm: LETTER_W_MM, doubled: false },
  tabloid: { wMm: TABLOID_W_MM, hMm: LETTER_H_MM, blockWMm: LETTER_W_MM, doubled: true },
  a4:      { wMm: A4_W_MM,      hMm: A4_H_MM,     blockWMm: A4_W_MM,     doubled: false },
  a3:      { wMm: A3_W_MM,      hMm: A3_H_MM,     blockWMm: A4_W_MM,     doubled: true },
};

const COLS_N = 2, ROWS_N = 4;

/* ── The template. EVERY GAP IS A SETTING, and these are only the numbers the
   shop measured off its own cut machine. Nothing here is centred, derived from
   a rule, or clever: the operator has a ruler and the machine, and inferring
   this instead of exposing it produced twenty rounds of wrong sheets.

   A and B place the columns; D places the rows. C and H are then simply what is
   left over — there is one degree of freedom per axis, because A, the cards and
   C have to sum to the sheet. The panel shows C and H live so the operator can
   see what a change did.                                                     */
export const DEF_MARGIN_X_MM = 14;    // A — sheet edge to the first cut line
export const DEF_MARGIN_TOP_MM = 8;   // D — head margin

export const DEF_GUTTER_X_MM = 7;     // B — down the middle, between the columns
/* THERE IS NO ROW GUTTER AT ALL. Not zero-by-default — gone, no setting. The
   rows BUTT: one cut line serves both cards, and the 1.5 mm bleed laps onto the
   neighbour, which is the same artwork, so the row pitch IS the cell height. B
   is a real gap and stays a setting — the columns do NOT butt. */

/* The vertical chain with the rows butted is four cells and nothing between:

     D 8 + 4(65) + H  =  8 + 260 + H         on a 279.4 sheet  ->  H 11.4

   The bleed is not a term in it. Bleed is drawn OUTSIDE each cell — it laps over
   the neighbouring card and over the margin — so it never moves a cut line and
   never consumes sheet. That is what "let the bleed spill over" means in the
   geometry: the cells are the cards, full stop. */

/** How much bigger the CUT is than the nominal card, on each dimension. The
 *  shop's machine cuts 1.5 over, so that is the cell — not a bleed allowance and
 *  not a fudge: it is the size the finished card comes off the guillotine. */
export const CELL_OVERSIZE_MM = 1.5;

/** The cell: the card laid sideways, 1.5 over on both dimensions. Never derived,
 *  never adjusted to make a margin come out — the cell IS the cut size. */
export const PLACED_W_MM = CARD_H_MM + CELL_OVERSIZE_MM;   // 90.4
export const PLACED_H_MM = CARD_W_MM + CELL_OVERSIZE_MM;   // 65

export const COLS = COLS_N;
export const ROWS = ROWS_N;

export interface DivinityCardTemplate {
  /** A — sheet edge to the first cut line. */ marginXMm?: number;
  /** B — between the columns. */              gutterXMm?: number;
  /** D — head margin. */                      marginTopMm?: number;
}

export interface CardRectMm { xMm: number; yMm: number; wMm: number; hMm: number; }

export interface DivinityCardFit {
  /** Sheet actually used, in mm. */
  sheetWMm: number; sheetHMm: number;
  /** Every card position, origin BOTTOM-LEFT (PDF convention). */
  cells: CardRectMm[];
  /** Cards on the sheet. */
  n: number;
  /** A and D as set; H (marginBottomMm) and C (marginRightMm) as they fall out. */
  marginXMm: number; marginTopMm: number; marginBottomMm: number; marginRightMm: number;
  /** The block itself — the cards plus the gutters between them. Reported so a
   *  caller can work back from C or H to A or D without restating the sums. */
  blockWMm: number; blockHMm: number;
  /** Where an A3 is cut into two A4s, as an x DOWN the sheet. Empty for a plain
   *  A4. The blocks sit side by side, so the cut is vertical. */
  cutXMm: number[];
}

export function fitDivinityCards(
  sheet: DivinityCardSheet = 'letter', t: DivinityCardTemplate = {},
): DivinityCardFit {
  const spec = SHEETS[sheet] ?? SHEETS.letter;
  const gX = t.gutterXMm ?? DEF_GUTTER_X_MM;

  /* The block's own size never moves — it is COLS cards plus the gutters. What
     the settings decide is where on the sheet it sits. */
  const blockW = COLS * PLACED_W_MM + (COLS - 1) * gX;
  const blockH = ROWS * PLACED_H_MM;      // rows butt — no gutter term at all

  const mX = t.marginXMm ?? DEF_MARGIN_X_MM;
  const mTop = t.marginTopMm ?? DEF_MARGIN_TOP_MM;
  /* C and H are the leftovers, not settings — they cannot be, because A, the
     cards and C must sum to the sheet. Reported so the panel can show them. */
  const mBot = spec.hMm - mTop - blockH;

  /** One block, offset by `originXMm` on the sheet. */
  const blockCells = (originXMm: number): CardRectMm[] => {
    const out: CardRectMm[] = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        out.push({
          xMm: originXMm + mX + c * (PLACED_W_MM + gX),
          /* Rows are numbered from the TOP of the sheet, the way a spec sheet
             reads, but PDF y runs up — so row 0 is the highest y. */
          yMm: spec.hMm - mTop - (r + 1) * PLACED_H_MM,
          wMm: PLACED_W_MM, hMm: PLACED_H_MM,
        });
      }
    }
    return out;
  };

  return {
    sheetWMm: spec.wMm, sheetHMm: spec.hMm,
    cells: spec.doubled
      ? [...blockCells(0), ...blockCells(spec.blockWMm)]
      : blockCells(0),
    n: (spec.doubled ? 2 : 1) * COLS * ROWS,
    marginXMm: mX, marginTopMm: mTop, marginBottomMm: mBot,
    marginRightMm: spec.blockWMm - mX - blockW, blockWMm: blockW, blockHMm: blockH,
    cutXMm: spec.doubled ? [spec.blockWMm] : [],
  };
}
