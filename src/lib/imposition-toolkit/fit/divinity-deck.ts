/* Divinity trading card DECK — a whole deck from one multi-page PDF, ganged on
 * portrait A4 sheets, eight up, cards LYING SIDEWAYS.
 *
 * THIS IS THE CUT MACHINE'S TEMPLATE. It is built from the two things the owner
 * measured with a ruler on the machine's own output:
 *
 *   the CUT CARD   89 x 63 mm   (a 2.5 x 3.5" card after the blade)
 *   the GUTTERS    10 mm between the columns, 3 mm between the rows
 *
 * Those are the INPUT. The margins are the remainder — they are not a choice,
 * and they cannot be set independently: once the sheet, the cell and the
 * gutters are fixed, what is left over is what is left over.
 *
 *   across   11 + 89 + 10 + 89 + 11              = 210
 *   down     18 + 63 + 3 + 63 + 3 + 63 + 3 + 63 + 18 = 297
 *
 * Both close on A4 exactly, which is the check that the template is right.
 *
 * The cell is 89 x 63; the artwork is a 2.5 x 3.5" card, 88.9 x 63.5 placed
 * sideways. Cover-fit, that loses about 0.5 mm off the height and nothing off
 * the width — the little bit of bleed the blade was taking anyway.
 *
 * There is no card-orientation option. The template is the machine's, not a
 * layout choice, and an upright card does not fit this grid at all.
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

/* ── Measured off the cut machine. Change these only with a ruler. ────────── */
/** The cell as the blade leaves it: sideways, long edge across the sheet. */
export const CELL_W_MM = 89;
export const CELL_H_MM = 63;
/** Between the two columns. */
export const GUTTER_X_MM = 10;
/** Between the rows. Not the same as the column gutter — measured separately. */
export const GUTTER_Y_MM = 3;
export const COLS = 2;
export const ROWS = 4;
export const PER_SHEET = COLS * ROWS;        // 8

/** The remainder, worked rather than restated, so the measured numbers above
 *  stay the single source of truth. */
export const MARGIN_X_MM = (SHEET_W_MM - COLS * CELL_W_MM - (COLS - 1) * GUTTER_X_MM) / 2;  // 11
export const MARGIN_Y_MM = (SHEET_H_MM - ROWS * CELL_H_MM - (ROWS - 1) * GUTTER_Y_MM) / 2;  // 18

export interface DeckCellMm { xMm: number; yMm: number; wMm: number; hMm: number; }

export interface DeckLayout {
  placedWMm: number; placedHMm: number;
  cols: number; rows: number; perSheet: number;
  marginXMm: number; marginYMm: number;
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
        yMm: SHEET_H_MM - MARGIN_Y_MM - (r + 1) * CELL_H_MM - r * GUTTER_Y_MM,
        wMm: CELL_W_MM, hMm: CELL_H_MM,
      });
    }
  }
  return {
    placedWMm: CELL_W_MM, placedHMm: CELL_H_MM,
    cols: COLS, rows: ROWS, perSheet: PER_SHEET,
    marginXMm: MARGIN_X_MM, marginYMm: MARGIN_Y_MM, cells,
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
