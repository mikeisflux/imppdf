/* Divinity trading card DECK — a whole deck from one multi-page PDF, ganged on
 * A4 sheets fed LONG EDGE FIRST.
 *
 * WHY LANDSCAPE. The shop feeds A4 long-edge-first through the bypass tray, on
 * purpose: running heavy card stock short-edge-first wears a band across the
 * fuser, and that band then shows up on 11x17 work afterwards. So the PAGE is
 * described 297 x 210 — the same sheet of paper, fed the other way.
 *
 * HOW MANY FIT. Worked all four ways rather than assumed:
 *
 *   A4 PORTRAIT  210 x 297   upright 3 x 3 = 9      turned 2 x 4 = 8
 *   A4 LANDSCAPE 297 x 210   upright 4 x 2 = 8      turned 3 x 3 = 9
 *
 * On the landscape sheet the card has to LIE ON ITS SIDE to get nine; upright
 * gives eight. Nine is 20 sheets for a 172-card deck against 22, so the card is
 * turned. It is cut out afterwards, so the turn costs nothing.
 *
 * Note this is the same physical arrangement as the portrait 3 x 3 in
 * fit/divinity-cards.ts, rotated a quarter turn with the sheet. Kept as its own
 * file because the two tools' sheets, margins and page order differ, and one
 * shared "cards" calculator tuned per caller is exactly what the project rules
 * say not to build.
 *
 * Asserted in test/fit-divinity-deck.test.ts.                                */

export const MM_PER_IN = 25.4;
export const PT_PER_MM = 72 / MM_PER_IN;

/** Standard trading card: 2.5 x 3.5 inches. */
export const CARD_W_MM = 2.5 * MM_PER_IN;    // 63.5
export const CARD_H_MM = 3.5 * MM_PER_IN;    // 88.9

/** As PLACED: turned, long edge across the sheet. */
export const PLACED_W_MM = CARD_H_MM;        // 88.9
export const PLACED_H_MM = CARD_W_MM;        // 63.5

export const COLS = 3;
export const ROWS = 3;
export const PER_SHEET = COLS * ROWS;        // 9
export const GUTTER_MM = 3;

/** A4 fed long edge first. Same paper as 210 x 297, described the other way. */
export const SHEET_W_MM = 297, SHEET_H_MM = 210;

export interface DeckCellMm { xMm: number; yMm: number; wMm: number; hMm: number; }

const blockW = COLS * PLACED_W_MM + (COLS - 1) * GUTTER_MM;   // 272.7
const blockH = ROWS * PLACED_H_MM + (ROWS - 1) * GUTTER_MM;   // 196.5
/** Centred — equal margins are what let a back sheet register with its front. */
export const MARGIN_X_MM = (SHEET_W_MM - blockW) / 2;         // 12.15
export const MARGIN_Y_MM = (SHEET_H_MM - blockH) / 2;         // 6.75

/** The nine positions on a sheet, origin BOTTOM-LEFT (PDF convention), read in
 *  the order a person reads them: left to right, top row first. */
export function deckCells(): DeckCellMm[] {
  const out: DeckCellMm[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      out.push({
        xMm: MARGIN_X_MM + c * (PLACED_W_MM + GUTTER_MM),
        yMm: SHEET_H_MM - MARGIN_Y_MM - (r + 1) * PLACED_H_MM - r * GUTTER_MM,
        wMm: PLACED_W_MM, hMm: PLACED_H_MM,
      });
    }
  }
  return out;
}

/** Sheets needed for a deck of `cardCount` cards. */
export function deckSheets(cardCount: number): number {
  return Math.ceil(Math.max(0, cardCount) / PER_SHEET);
}

/** Which card (0-based) lands in a cell, or -1 where the sheet runs out.
 *  SEQUENTIAL, not cut-and-stack: a deck is collated by hand off the guillotine,
 *  and having sheet 1 hold cards 1-9 is what makes that possible to check. */
export function deckCardAt(sheetIdx: number, cellIdx: number, cardCount: number): number {
  const i = sheetIdx * PER_SHEET + cellIdx;
  return i < cardCount ? i : -1;
}

/** Cards actually on a given sheet — the last one is usually short. */
export function cardsOnSheet(sheetIdx: number, cardCount: number): number {
  return Math.max(0, Math.min(PER_SHEET, cardCount - sheetIdx * PER_SHEET));
}
