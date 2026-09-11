/* Divinity trading card DECK — a whole deck from one multi-page PDF, ganged
 * 8-up on portrait A4, cards LYING SIDEWAYS.
 *
 * THE CARD SIZE IS THE INPUT. A trading card is 2.5 x 3.5 inches and nothing
 * else; that is the product. Placed sideways the cell is 88.9 x 63.5, exactly,
 * and the artwork therefore needs no scaling and loses nothing.
 *
 * The GUTTERS are measured off the shop's cut machine — 10 mm between the
 * columns, 3 mm between the rows — as is the 6.5 mm head margin.
 *
 * THE OUTER MARGINS ARE THE REMAINDER. They cannot also be dictated: eight gaps
 * and a card size cannot all be chosen at once, because they have to sum to the
 * sheet. The margins are the right thing to give, because they are WASTE — they
 * get trimmed off and binned, so a millimetre either way costs nothing, whereas
 * a millimetre on the card is a card that is the wrong size.
 *
 *   across  11.1 + 88.9 + 10 + 88.9 + 11.1          = 210
 *   down    6.5 + 4(63.5) + 3(3) + 27.5               = 297
 *
 * Both close on A4 exactly. The block is PINNED TO THE HEAD (6.5 at the top,
 * the slack at the foot), so the sheet is symmetric across but not down: it
 * backs up on a LONG-EDGE flip and not end-for-end. Both are asserted.
 *
 * Asserted in test/fit-divinity-deck.test.ts.                                */

export const MM_PER_IN = 25.4;
export const PT_PER_MM = 72 / MM_PER_IN;

/** A standard 2.5 x 3.5" trading card. THE input — the cell is this, exactly. */
export const CARD_W_MM = 2.5 * MM_PER_IN;    // 63.5
export const CARD_H_MM = 3.5 * MM_PER_IN;    // 88.9

/** Portrait A4 — the sheet as the shop sees and cuts it. */
export const SHEET_W_MM = 210, SHEET_H_MM = 297;

/** The cell IS the card, laid sideways. Never derived, never adjusted to make a
 *  margin come out — a card that is not 2.5 x 3.5 is not a trading card. */
export const CELL_W_MM = CARD_H_MM;          // 88.9
export const CELL_H_MM = CARD_W_MM;          // 63.5

/* ── Measured off the cut machine. Change these only with a ruler. ──────────
   Letters are the ones on the cut map: B between the columns, D head,
   E/F/G between the rows.                                                   */
/** B — between the two columns. */
export const GUTTER_X_MM = 10;
/** D — sheet edge to the first cut line at the head. Not more, not less. */
export const MARGIN_TOP_MM = 6.5;
/** E, F and G — between the rows. NOT the same as the column gutter. */
export const GUTTER_Y_MM = 3;

export const COLS = 2;
export const ROWS = 4;
export const PER_SHEET = COLS * ROWS;        // 8

/* ── The waste. Worked, never stated: whatever the card and the gutters leave
   is what gets trimmed off and binned. ──────────────────────────────────── */
/** A and C — equal, which is what lets a long-edge flip register. */
export const MARGIN_X_MM =
  (SHEET_W_MM - COLS * CELL_W_MM - (COLS - 1) * GUTTER_X_MM) / 2;                        // 11.1
/** H — the slack, all of it at the foot, since the head margin is fixed. */
export const MARGIN_BOTTOM_MM =
  SHEET_H_MM - MARGIN_TOP_MM - ROWS * CELL_H_MM - (ROWS - 1) * GUTTER_Y_MM;              // 27.5

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
