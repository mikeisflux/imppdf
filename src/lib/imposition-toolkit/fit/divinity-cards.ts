/* Divinity trading cards — one card artwork ganged 8-up on A4 and the block
 * duplicated onto A3, so one A3 cuts in half into two identical A4s to run.
 *
 * THE CELL IS ALWAYS A TRUE 2.5 x 3.5" CARD, laid sideways (88.9 x 63.5).
 * That is never derived and never adjusted to make a margin come out: a cell
 * that is not a card cuts cards that are the wrong size.
 *
 * WHERE THE BLOCK SITS is the operator's to set — it is a property of the shop's
 * cut machine, and twenty rounds of inferring it from measured gaps produced a
 * template that printed off the top of the sheet. The gutters and margins are
 * settings now, with `centre` on by default.
 *
 * CENTRED BY DEFAULT, for a printing reason: pinned 6.5 mm off the head, the top
 * row lands inside the unprintable margin of most lasers — the PDF is correct,
 * every page box says 210 x 297, and the press still clips the top row. Centred,
 * the block sits 17 mm clear top and bottom and 11.05 clear either side.
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

/* ── The template, as the operator sets it. ────────────────────────────────
   These are DEFAULTS. Every one is overridable from the panel, because the
   position of the block on the sheet is a property of the shop's cut machine
   and nobody but the operator, with a ruler and a test sheet, can know it. The
   CELL is never one of them: it is always a true 2.5 x 3.5" card, because a
   cell that is not a card cuts cards that are the wrong size.               */
export const DEF_MARGIN_X_MM = 14;    // A and C — sheet edge to the first cut line
export const DEF_GUTTER_X_MM = 10;    // B — between the columns
/** D — head margin. Only used when `centre` is off. */
export const DEF_MARGIN_TOP_MM = 6.5;
export const DEF_GUTTER_Y_MM = 3;     // E/F/G — between the rows

/** The cell IS the card, laid sideways. Never derived, never adjusted to make a
 *  margin come out. */
export const PLACED_W_MM = CARD_H_MM;             // 88.9
export const PLACED_H_MM = CARD_W_MM;             // 63.5

export const COLS = 2;
export const ROWS = 4;

export interface DivinityCardTemplate {
  /** A and C. */ marginXMm?: number;
  /** B. */       gutterXMm?: number;
  /** D. */       marginTopMm?: number;
  /** E/F/G. */   gutterYMm?: number;
  /** Centre the block on the sheet instead of pinning it by A and D. DEFAULT
   *  ON, and it is the default for a printing reason, not a tidiness one: a
   *  block pinned 6.5 mm off the head puts the top row inside the unprintable
   *  margin of most lasers, so the sheet looks right on screen and comes off
   *  the press with the top row clipped. Centred, the same eight cards sit
   *  17 mm clear top and bottom. Untick it only to match a machine template
   *  that genuinely wants the block off-centre. */
  centre?: boolean;
}

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

export function fitDivinityCards(
  sheet: 'a4' | 'a3' = 'a3', t: DivinityCardTemplate = {},
): DivinityCardFit {
  const gX = t.gutterXMm ?? DEF_GUTTER_X_MM;
  const gY = t.gutterYMm ?? DEF_GUTTER_Y_MM;

  /* The block's own size never moves — it is COLS cards plus the gutters. What
     the settings decide is where on the sheet it sits. */
  const blockW = COLS * PLACED_W_MM + (COLS - 1) * gX;
  const blockH = ROWS * PLACED_H_MM + (ROWS - 1) * gY;

  const centre = t.centre !== false;
  const mX = centre ? (A4_W_MM - blockW) / 2 : (t.marginXMm ?? DEF_MARGIN_X_MM);
  const mTop = centre ? (A4_H_MM - blockH) / 2 : (t.marginTopMm ?? DEF_MARGIN_TOP_MM);
  const mBot = A4_H_MM - mTop - blockH;

  /** One A4 block, offset by `originXMm` on the sheet. */
  const blockCells = (originXMm: number): CardRectMm[] => {
    const out: CardRectMm[] = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        out.push({
          xMm: originXMm + mX + c * (PLACED_W_MM + gX),
          /* Rows are numbered from the TOP of the sheet, the way a spec sheet
             reads, but PDF y runs up — so row 0 is the highest y. */
          yMm: A4_H_MM - mTop - (r + 1) * PLACED_H_MM - r * gY,
          wMm: PLACED_W_MM, hMm: PLACED_H_MM,
        });
      }
    }
    return out;
  };

  if (sheet === 'a4') {
    return {
      sheetWMm: A4_W_MM, sheetHMm: A4_H_MM, cells: blockCells(0),
      n: COLS * ROWS, marginXMm: mX, marginTopMm: mTop, marginBottomMm: mBot, cutXMm: [],
    };
  }
  return {
    sheetWMm: A3_W_MM, sheetHMm: A3_H_MM,
    cells: [...blockCells(0), ...blockCells(A4_W_MM)],
    n: 2 * COLS * ROWS, marginXMm: mX, marginTopMm: mTop, marginBottomMm: mBot,
    cutXMm: [A4_W_MM],
  };
}
