/* Divinity trading card DECK — a whole deck from one multi-page PDF, ganged
 * 8-up on portrait A4, cards LYING SIDEWAYS.
 *
 * THIS IS THE CUT MACHINE'S TEMPLATE. Every gap below was measured off the
 * machine with a ruler, and every gap is the INPUT. The CELL is the remainder.
 * That inverts how the rest of the toolkit works — everywhere else the piece
 * size is fixed and the margins fall out — and it is deliberate: the machine
 * cuts where it cuts, and the file has to meet it.
 *
 *   across  A 14 + 86 + B 10 + 86 + C 14                    = 210
 *   down    D 6.5 + 67.625 + E 3 + 67.625 + F 3 + 67.625
 *                 + G 3 + 67.625 + H 11                     = 297
 *
 * Both close on A4 exactly, which is the check that the template is right.
 * The letters are the ones on the cut map the owner marked up.
 *
 * So the cell is 86 x 67.625 mm. The artwork is a 2.5 x 3.5" card (88.9 x 63.5)
 * placed sideways, which is a WIDER, SHORTER shape than the cell: cover-fit
 * scales it up about 6% and clips roughly 4 mm off each long edge. That is real
 * artwork lost, and it is what these gaps require — if it is too much, the
 * number to re-measure is E/F/G, since the four rows have to fill whatever the
 * head and foot margins leave.
 *
 * THE BLOCK IS PINNED TO THE HEAD, not centred: 6.5 at the top against 11 at
 * the foot. So the sheet backs up on a LONG-EDGE flip (it is centred across)
 * but NOT end-for-end. Both halves of that are asserted.
 *
 * Asserted in test/fit-divinity-deck.test.ts.                                */

export const MM_PER_IN = 25.4;
export const PT_PER_MM = 72 / MM_PER_IN;

/** The artwork's nominal size — a standard 2.5 x 3.5" card. Stated for
 *  comparison only; the CELL below is what actually gets used. */
export const CARD_W_MM = 2.5 * MM_PER_IN;    // 63.5
export const CARD_H_MM = 3.5 * MM_PER_IN;    // 88.9

/** Portrait A4 — the sheet as the shop sees and cuts it. */
export const SHEET_W_MM = 210, SHEET_H_MM = 297;

/* ── Measured off the cut machine. Change these only with a ruler. ──────────
   Named for the letters on the cut map: A/C sides, B between the columns,
   D head, E/F/G between the rows, H foot.                                   */
/** A and C — sheet edge to the first cut line, both sides. */
export const MARGIN_X_MM = 14;
/** B — between the two columns. */
export const GUTTER_X_MM = 10;
/** D — sheet edge to the first cut line at the head. Not more, not less. */
export const MARGIN_TOP_MM = 6.5;
/** E, F and G — between the rows. NOT the same as the column gutter. */
export const GUTTER_Y_MM = 3;
/** H — last cut line to the foot of the sheet. */
export const MARGIN_BOTTOM_MM = 11;

export const COLS = 2;
export const ROWS = 4;
export const PER_SHEET = COLS * ROWS;        // 8

/* The cell is the REMAINDER — worked, never restated, so the measured gaps
   above stay the single source of truth. */
export const CELL_W_MM =
  (SHEET_W_MM - 2 * MARGIN_X_MM - (COLS - 1) * GUTTER_X_MM) / COLS;                      // 86
export const CELL_H_MM =
  (SHEET_H_MM - MARGIN_TOP_MM - MARGIN_BOTTOM_MM - (ROWS - 1) * GUTTER_Y_MM) / ROWS;     // 67.625

export interface DeckCellMm { xMm: number; yMm: number; wMm: number; hMm: number; }

export interface DeckLayout {
  placedWMm: number; placedHMm: number;
  cols: number; rows: number; perSheet: number;
  marginXMm: number; marginTopMm: number; marginBottomMm: number;
  cells: DeckCellMm[];
}

export function deckLayout(): DeckLayout {
  /* Origin BOTTOM-LEFT (PDF convention), read in the order a person reads
     them: left to right, top row first. */
  const cells: DeckCellMm[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      cells.push({
        xMm: MARGIN_X_MM + c * (CELL_W_MM + GUTTER_X_MM),
        yMm: SHEET_H_MM - MARGIN_TOP_MM - (r + 1) * CELL_H_MM - r * GUTTER_Y_MM,
        wMm: CELL_W_MM, hMm: CELL_H_MM,
      });
    }
  }
  return {
    placedWMm: CELL_W_MM, placedHMm: CELL_H_MM,
    cols: COLS, rows: ROWS, perSheet: PER_SHEET,
    marginXMm: MARGIN_X_MM, marginTopMm: MARGIN_TOP_MM, marginBottomMm: MARGIN_BOTTOM_MM, cells,
  };
}

/** Sheets needed for a deck of `cardCount` cards. */
export function deckSheets(cardCount: number): number {
  return Math.ceil(Math.max(0, cardCount) / PER_SHEET);
}

/** Which card (0-based) lands in a cell, or -1 where the sheet runs out.
 *  SEQUENTIAL, not cut-and-stack: a deck is collated by hand off the guillotine,
 *  and having sheet 1 hold cards 1-8 is what makes that possible to check. */
export function deckCardAt(sheetIdx: number, cellIdx: number, cardCount: number): number {
  const i = sheetIdx * PER_SHEET + cellIdx;
  return i < cardCount ? i : -1;
}

/** Cards actually on a given sheet — the last one is usually short. */
export function cardsOnSheet(sheetIdx: number, cardCount: number): number {
  return Math.max(0, Math.min(PER_SHEET, cardCount - sheetIdx * PER_SHEET));
}
