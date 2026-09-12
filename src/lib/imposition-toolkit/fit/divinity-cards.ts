/* Divinity trading cards — one card artwork ganged 8-up on A4 and the block
 * duplicated onto A3, so one A3 cuts in half into two identical A4s to run.
 *
 * THE CELL IS THE CARD PLUS 2 mm, laid sideways: 90.9 x 65.5. A 2.5 x 3.5" card
 * is 88.9 x 63.5, and the shop cuts it 2 over on each dimension — the cell size
 * is the CUT size, stated by the operator off the machine. Never derived and
 * never nudged to make a margin come out: a cell that is not the cut size cuts
 * cards that are the wrong size.
 *
 * B IS 8.5 — a real gap down the middle, measured off the machine. E, F and G are
 * the three gaps between the rows, 0.5 each.
 *
 * EVERY GAP IS A SETTING, and C and H can be typed as readily as A and D — they
 * are the far end of the same two spans, so entering one just places the block
 * from that edge instead. There is still only ONE degree of freedom per axis:
 * A + block + C must equal the sheet.
 *
 * THE VALIDATED TEMPLATE, measured off PRODUCTION stock and confirmed on a cut
 * stack:
 *
 *     A 16.25   B 8.5   D 4.75   E 0   F 0.7   G 0.7   sheet LETTER
 *     C and H then fall out at 9.35 and 11.25.
 *
 *     across  16.25 + 90.9 + 8.5 + 90.9 + 9.35     = 215.9
 *     down    4.75 + 4(65.5) + 0 + 0.7 + 0.7 + 11.25 = 279.4
 *
 * THERE IS NO BLEED AND NOTHING IS DRAWN OUTSIDE A CELL, so EVERY GAP HERE IS
 * WHAT THE RULER READS on the sheet — the white paper between two cards. When
 * the card is made bigger, the CELL grows and the gutters come down by the
 * matching amount, which keeps the cards where they are. A build that instead
 * overflowed the cells by 1.5 put 3 mm of ink into a 0.5 mm row gap, overlapped
 * the rows, and made the row settings do nothing anyone could see.
 *
 * THE ROW GAPS ARE 0, 0.7, 0.7 — E, F and G, each its own setting and each real
 * paper between two cards. They differ because the machine's feed does; rows 1
 * and 2 now share a cut line outright. Change one and H closes up by exactly
 * that much: D stays where it is and the block grows downward.
 *
 * A IS NOT EQUAL TO C — 16.25 against 9.35, so the block sits well right of
 * centre. That is not a mistake and not something to tidy up: these numbers
 * describe where the machine actually cuts, measured off its own output, and
 * re-centring them breaks the template. Several earlier sets were validated and
 * then abandoned when the stock changed; heavier card registers differently
 * through the machine.
 *
 * THE CHAINS ARE THE WHOLE TRUTH. Nothing is drawn outside a cell, so A + the
 * cards + the gutters + C is the sheet width exactly, and D + the cards + E F G
 * + H is the sheet height exactly. What you type is what the ruler finds.
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

   A and B place the columns; D, E, F and G place the rows. C and H are then what is
   left over — there is one degree of freedom per axis, because A, the cards and
   C have to sum to the sheet. The panel shows C and H live so the operator can
   see what a change did.                                                     */
export const DEF_MARGIN_X_MM = 16.25; // A — sheet edge to the first cut line
export const DEF_MARGIN_TOP_MM = 4.75;// D — head margin

export const DEF_GUTTER_X_MM = 8.5;   // B — down the middle, between the columns

/* E, F and G: the three gaps BETWEEN THE ROWS, top to bottom. Each is its own
   setting and each DEFAULTS TO 0 — the rows touch, one cut line serves both
   cards, and the 1.5 mm bleed laps onto the neighbour, which is the same
   artwork. They are separate rather than one shared figure because every crack
   on the sheet has its own letter and its own box: the operator measures three
   gaps with a ruler, not one gap three times, and a machine that drifts down
   the sheet needs them to differ. */
export const DEF_GUTTER_E_MM = 0;     // E — row 1 to row 2 (rows 1/2 now touch)
export const DEF_GUTTER_F_MM = 0.7;   // F — row 2 to row 3
export const DEF_GUTTER_G_MM = 0.7;   // G — row 3 to row 4

/* The vertical chain is four cells plus E, F and G:

     D 4.75 + 4(65.5) + E + F + G + H        on a 279.4 sheet
     at the default 0 0.7 0.7            ->  H 11.25

   Nothing is drawn outside a cell, so that sum is the sheet exactly. */

/** How much bigger the finished card is than the nominal 2.5 x 3.5", per
 *  dimension. Not a bleed allowance: the shop's card is simply this size and the
 *  art is laid at it. It went 1.5 -> 2 when the card was extended a quarter
 *  millimetre on every side; the gutters came down by the matching amount in the
 *  same change, so not one card moved on the sheet. That is the rule here —
 *  GROW THE CELL AND PAY FOR IT OUT OF THE GUTTERS, never overflow a gutter,
 *  because a gutter that is partly under ink is a number nobody can measure. */
export const CELL_OVERSIZE_MM = 2;


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
  /** E — row 1 to row 2. Default 0: they touch. */ gutterEMm?: number;
  /** F — row 2 to row 3. Default 0: they touch. */ gutterFMm?: number;
  /** G — row 3 to row 4. Default 0: they touch. */ gutterGMm?: number;
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
  /** E, F and G as set, top to bottom. Reported so the panel can label the three
   *  row gaps without recomputing which setting landed where. */
  rowGapsMm: [number, number, number];
  /** Where an A3 is cut into two A4s, as an x DOWN the sheet. Empty for a plain
   *  A4. The blocks sit side by side, so the cut is vertical. */
  cutXMm: number[];
}

export function fitDivinityCards(
  sheet: DivinityCardSheet = 'letter', t: DivinityCardTemplate = {},
): DivinityCardFit {
  const spec = SHEETS[sheet] ?? SHEETS.letter;
  const gX = t.gutterXMm ?? DEF_GUTTER_X_MM;
  /* E, F, G top to bottom — three separate gaps, not one repeated. */
  const rowGaps: [number, number, number] = [
    t.gutterEMm ?? DEF_GUTTER_E_MM,
    t.gutterFMm ?? DEF_GUTTER_F_MM,
    t.gutterGMm ?? DEF_GUTTER_G_MM,
  ];

  /* The block's own size never moves — it is COLS cards plus the gutters. What
     the settings decide is where on the sheet it sits. */
  const blockW = COLS * PLACED_W_MM + (COLS - 1) * gX;
  const blockH = ROWS * PLACED_H_MM + rowGaps[0] + rowGaps[1] + rowGaps[2];

  const mX = t.marginXMm ?? DEF_MARGIN_X_MM;
  const mTop = t.marginTopMm ?? DEF_MARGIN_TOP_MM;
  /* C and H are the leftovers, not settings — they cannot be, because A, the
     cards and C must sum to the sheet. Reported so the panel can show them. */
  const mBot = spec.hMm - mTop - blockH;

  /* How far row r's TOP sits below the head, counting the cells above it and
     whichever of E, F, G lie between. Accumulated rather than multiplied,
     because the three gaps can differ. */
  const rowTop = (r: number) => {
    let y = mTop;
    for (let i = 0; i < r; i++) y += PLACED_H_MM + rowGaps[i]!;
    return y;
  };

  /** One block, offset by `originXMm` on the sheet. */
  const blockCells = (originXMm: number): CardRectMm[] => {
    const out: CardRectMm[] = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        out.push({
          xMm: originXMm + mX + c * (PLACED_W_MM + gX),
          /* Rows are numbered from the TOP of the sheet, the way a spec sheet
             reads, but PDF y runs up — so row 0 is the highest y. */
          yMm: spec.hMm - rowTop(r) - PLACED_H_MM,
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
    rowGapsMm: rowGaps,
    cutXMm: spec.doubled ? [spec.blockWMm] : [],
  };
}
