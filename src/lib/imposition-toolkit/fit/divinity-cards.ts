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

/* ── The sheets. LETTER is the default because it is what is in the shop's
   tray: 8.5 x 11 is 215.9 x 279.4, and an A4 page is 17.6 mm TALLER than that.
   Sending A4 to a Letter tray is what put the top row off the sheet — the file
   measured a correct A4 all the way through and the paper was never A4.

   It is also the sheet on which the owner's measured template closes:
     across  12.55 + 88.9 + 13 + 88.9 + 12.55 = 215.9  (Letter, exactly)
     down    6.5 + 4(63.5) + 3(3) + 11  = 280.5  (Letter is 279.4)
   Those same margins need 215.8 mm of a 210 mm A4, which is why they could
   never be honoured there.                                                 */
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

/* ── The template, as the operator sets it. ────────────────────────────────
   These are DEFAULTS. Every one is overridable from the panel, because the
   position of the block on the sheet is a property of the shop's cut machine
   and nobody but the operator, with a ruler and a test sheet, can know it. The
   CELL is never one of them: it is always a true 2.5 x 3.5" card, because a
   cell that is not a card cuts cards that are the wrong size.               */
export const DEF_MARGIN_X_MM = 14;    // A and C — sheet edge to the first cut line
/* B — between the columns. 13, not 9: the owner asked for A and C each 2 mm
   tighter, and with the card size fixed the only place those 4 mm can go is
   between the columns. Centred on Letter that lands A = C = 12.55 exactly. */
export const DEF_GUTTER_X_MM = 13;
/** D — head margin. Only used when `centre` is off. */
export const DEF_MARGIN_TOP_MM = 6.5;
export const DEF_GUTTER_Y_MM = 3;     // E/F/G — between the rows
/** Nudge off centre. +x right (C shrinks, A grows), +y down. Zero by default —
 *  the shop wants A and C equal, which is what centring gives. */
export const DEF_SHIFT_X_MM = 0;
export const DEF_SHIFT_Y_MM = 0;

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
  /** Nudge the whole block after centring. +x moves it RIGHT, which shrinks C
   *  and grows A by the same amount; +y moves it DOWN, shrinking the foot and
   *  growing the head. There is only ONE degree of freedom per axis — A and C
   *  must sum with the block to the sheet — so a nudge is the honest control:
   *  asking for "C smaller by 4" IS asking for the block 4 mm to the right. */
  shiftXMm?: number;
  shiftYMm?: number;
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
  sheet: DivinityCardSheet = 'letter', t: DivinityCardTemplate = {},
): DivinityCardFit {
  const spec = SHEETS[sheet] ?? SHEETS.letter;
  const gX = t.gutterXMm ?? DEF_GUTTER_X_MM;
  const gY = t.gutterYMm ?? DEF_GUTTER_Y_MM;

  /* The block's own size never moves — it is COLS cards plus the gutters. What
     the settings decide is where on the sheet it sits. */
  const blockW = COLS * PLACED_W_MM + (COLS - 1) * gX;
  const blockH = ROWS * PLACED_H_MM + (ROWS - 1) * gY;

  const centre = t.centre !== false;
  const baseX = centre ? (spec.blockWMm - blockW) / 2 : (t.marginXMm ?? DEF_MARGIN_X_MM);
  const baseY = centre ? (spec.hMm - blockH) / 2 : (t.marginTopMm ?? DEF_MARGIN_TOP_MM);
  const mX = baseX + (t.shiftXMm ?? DEF_SHIFT_X_MM);
  const mTop = baseY + (t.shiftYMm ?? DEF_SHIFT_Y_MM);
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
          yMm: spec.hMm - mTop - (r + 1) * PLACED_H_MM - r * gY,
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
    cutXMm: spec.doubled ? [spec.blockWMm] : [],
  };
}
