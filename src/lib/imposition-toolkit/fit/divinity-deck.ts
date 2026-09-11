/* Divinity trading card DECK — a whole deck from one multi-page PDF, ganged on
 * A4 sheets.
 *
 * THE SHEET IS PORTRAIT and the card LIES ACROSS it. Owner requirement, both
 * halves of it. On a portrait A4 that is the eight-up arrangement:
 *
 *   210 x 297 sheet, 3 mm gutter
 *     ACROSS (default)  88.9 x 63.5   2 across x 4 down = 8   margins 14.60 / 17.00
 *     UPRIGHT           63.5 x 88.9   3 across x 3 down = 9   margins  6.75 / 12.15
 *
 * Nine is available and is NOT taken: the shop's guillotine cuts eight off an
 * A4, and it cuts them lying across. Eight is the requirement; the ninth card is
 * the trap. Both counts are asserted so neither can quietly change.
 *
 * Note eight-across-on-portrait is the same physical sheet as eight-upright-on-
 * landscape — turn one a quarter turn and you have the other. The page box is
 * described the way the shop wants to see and cut it; which edge goes into the
 * printer first is a tray setting, not something a page box decides.
 *
 * Counts are WORKED here, never hard-coded, so a size change can't leave a
 * stale number behind. Asserted in test/fit-divinity-deck.test.ts.          */

export const MM_PER_IN = 25.4;
export const PT_PER_MM = 72 / MM_PER_IN;

/** Standard trading card: 2.5 x 3.5 inches. */
export const CARD_W_MM = 2.5 * MM_PER_IN;    // 63.5
export const CARD_H_MM = 3.5 * MM_PER_IN;    // 88.9

export const GUTTER_MM = 3;

/** A4 PORTRAIT — the sheet as the shop wants to see and cut it. */
export const SHEET_W_MM = 210, SHEET_H_MM = 297;

/** How the card sits on the sheet. 'turned' lies it ACROSS the portrait sheet,
 *  which is the 8-up the cutter wants; 'upright' is the 9-up that is not. */
export type DeckOrient = 'upright' | 'turned';
export const DEFAULT_ORIENT: DeckOrient = 'turned';

export interface DeckCellMm { xMm: number; yMm: number; wMm: number; hMm: number; }

export interface DeckLayout {
  orient: DeckOrient;
  /** The card AS PLACED — swapped when it's turned. */
  placedWMm: number; placedHMm: number;
  cols: number; rows: number; perSheet: number;
  marginXMm: number; marginYMm: number;
  cells: DeckCellMm[];
}

/** How many `size`-wide items fit across `span` with a gutter between each.
 *  n items need n*size + (n-1)*gutter, which rearranges to this. */
const fitCount = (span: number, size: number) =>
  Math.max(0, Math.floor((span + GUTTER_MM) / (size + GUTTER_MM)));

export function deckLayout(orient: DeckOrient = DEFAULT_ORIENT): DeckLayout {
  const turned = orient === 'turned';
  const placedWMm = turned ? CARD_H_MM : CARD_W_MM;
  const placedHMm = turned ? CARD_W_MM : CARD_H_MM;

  const cols = fitCount(SHEET_W_MM, placedWMm);
  const rows = fitCount(SHEET_H_MM, placedHMm);

  const blockW = cols * placedWMm + (cols - 1) * GUTTER_MM;
  const blockH = rows * placedHMm + (rows - 1) * GUTTER_MM;
  /* Centred — equal margins are what let a back sheet register with its front
     however the stack is turned over between passes. */
  const marginXMm = (SHEET_W_MM - blockW) / 2;
  const marginYMm = (SHEET_H_MM - blockH) / 2;

  /* Origin BOTTOM-LEFT (PDF convention), read in the order a person reads
     them: left to right, top row first. */
  const cells: DeckCellMm[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push({
        xMm: marginXMm + c * (placedWMm + GUTTER_MM),
        yMm: SHEET_H_MM - marginYMm - (r + 1) * placedHMm - r * GUTTER_MM,
        wMm: placedWMm, hMm: placedHMm,
      });
    }
  }
  return { orient, placedWMm, placedHMm, cols, rows, perSheet: cols * rows, marginXMm, marginYMm, cells };
}

/** Sheets needed for a deck of `cardCount` cards. */
export function deckSheets(cardCount: number, perSheet: number): number {
  if (perSheet <= 0) return 0;
  return Math.ceil(Math.max(0, cardCount) / perSheet);
}

/** Which card (0-based) lands in a cell, or -1 where the sheet runs out.
 *  SEQUENTIAL, not cut-and-stack: a deck is collated by hand off the guillotine,
 *  and having sheet 1 hold cards 1-9 is what makes that possible to check. */
export function deckCardAt(sheetIdx: number, cellIdx: number, cardCount: number, perSheet: number): number {
  const i = sheetIdx * perSheet + cellIdx;
  return i < cardCount ? i : -1;
}

/** Cards actually on a given sheet — the last one is usually short. */
export function cardsOnSheet(sheetIdx: number, cardCount: number, perSheet: number): number {
  return Math.max(0, Math.min(perSheet, cardCount - sheetIdx * perSheet));
}
