/* A4 Business Card Cutter — the manufacturer's own 10-up template.
 *
 * Their drawing (the cutter's manual, page 6): an A4 holds two columns of five
 * 90 x 54 cards, each in a 93 x 57 LAYOUT BOX — 1.5 mm past the cut on every
 * side. The boxes touch: 12 + 93 + 93 + 12 = 210 across, 6 + 5(57) + 6 = 297
 * down. So the cuts fall 3 mm apart (the groove), 13.5 from each side and 7.5
 * from the head and foot, and the block of cut cards is exactly centered.
 *
 *   A4   across  A 13.5 + 90 + B 3 + 90 + C 13.5 = 210
 *        down    D 7.5 + 5(54) + 4(3) + H 7.5    = 297     10 cards
 *
 * Doubled stocks are TWO of those blocks side by side with the guillotine cut
 * between them, reasoned about landscape and then the finished page stood up
 * so nothing from this tool comes out landscape (same rule as the trading
 * cards):
 *
 *   A3        two A4 blocks, 420 x 297 stood up to 297 x 420, cut at 210  — 20
 *   11 x 17   two LETTER halves, 431.8 x 279.4 stood up to 279.4 x 431.8,
 *             cut at 215.9                                                — 16
 *
 * A Letter half is 279.4 tall and the five-row block is 282 of cards alone, so
 * a Letter half takes FOUR rows (the sixteen on an 11 x 17 are 2 x 8). The
 * template is otherwise unchanged on it: same cards, bleed and groove, the
 * block centered on the half, so each half cuts on the A4 program with a
 * slightly wider edge margin (the sheet is 5.9 wider than A4).
 *
 * THE CUTTER STEPS ONE CONSTANT PITCH, so there is a single row gutter here,
 * not one per row. The gutters place the CUTS; the art is laid at the layout
 * size and never moves a cut. */

export const MM_PER_IN = 25.4;
export const PT_PER_MM = 72 / MM_PER_IN;

/** The card as cut, from the template: 90 x 54. */
export const BC_CARD_W_MM = 90;
export const BC_CARD_H_MM = 54;
/** Layout box = card + this on every side: 93 x 57. */
export const BC_BLEED_MM = 1.5;
export const BC_LAYOUT_W_MM = BC_CARD_W_MM + 2 * BC_BLEED_MM;   // 93
export const BC_LAYOUT_H_MM = BC_CARD_H_MM + 2 * BC_BLEED_MM;   // 57
/** The groove between adjacent cards — two bleeds, so the layout boxes touch. */
export const BC_GROOVE_MM = 2 * BC_BLEED_MM;                    // 3
/** Past the layout box the art's edge is carried outward across the margin
 *  to this far (or the paper's edge), as registration tolerance. */
export const BC_OUTER_BLEED_MM = 8;
export const BC_STREAK_MM = 0.5;
export const BC_SEAM_MM = 0.3;
export const BC_COLS = 2;
/** The red cut-line band for honing: 1 mm, lying entirely OUTSIDE the cell
 *  with its inner edge ON the cut, so a blade on the line leaves no red on
 *  the card and any red that shows is the overshoot, exact width. */
export const BC_CUT_LINE_MM = 1;

export const A4_W_MM = 210, A4_H_MM = 297;
export const A3_W_MM = 420, A3_H_MM = 297;
export const LETTER_W_MM = 8.5 * MM_PER_IN;   // 215.9
export const LETTER_H_MM = 11 * MM_PER_IN;    // 279.4
export const TABLOID_W_MM = 17 * MM_PER_IN;   // 431.8

export type BusinessCardSheet = 'a4' | 'a3' | 'letter' | 'tabloid';

export interface BusinessCardTemplate {
  /** A — sheet edge to the first cut. */        marginXMm?: number;
  /** B — between the columns. */                gutterXMm?: number;
  /** D — head to the first cut. */              marginTopMm?: number;
  /** The one row gutter, repeated every row. */ gutterYMm?: number;
}

interface SheetSpec {
  wMm: number; hMm: number; blockWMm: number; blockHMm: number; rows: number;
  doubled: boolean; rotated?: boolean;
}

const SHEETS: Record<BusinessCardSheet, SheetSpec> = {
  a4:      { wMm: A4_W_MM, hMm: A4_H_MM, blockWMm: A4_W_MM, blockHMm: A4_H_MM, rows: 5, doubled: false },
  a3:      { wMm: A3_W_MM, hMm: A3_H_MM, blockWMm: A4_W_MM, blockHMm: A4_H_MM, rows: 5, doubled: true, rotated: true },
  letter:  { wMm: LETTER_W_MM, hMm: LETTER_H_MM, blockWMm: LETTER_W_MM, blockHMm: LETTER_H_MM, rows: 4, doubled: false },
  tabloid: { wMm: TABLOID_W_MM, hMm: LETTER_H_MM, blockWMm: LETTER_W_MM, blockHMm: LETTER_H_MM, rows: 4, doubled: true, rotated: true },
};

/** Rows of cards in one block on this stock. */
export function rowsFor(sheet: BusinessCardSheet): number {
  return (SHEETS[sheet] ?? SHEETS.a4).rows;
}

/** The template's own figures for a stock: the block of cards centered on the
 *  block's sheet, with the groove between them. */
export function sheetDefaults(sheet: BusinessCardSheet = 'a4'): Required<BusinessCardTemplate> {
  const spec = SHEETS[sheet] ?? SHEETS.a4;
  const blockW = BC_COLS * BC_CARD_W_MM + (BC_COLS - 1) * BC_GROOVE_MM;
  const blockH = spec.rows * BC_CARD_H_MM + (spec.rows - 1) * BC_GROOVE_MM;
  return {
    marginXMm: (spec.blockWMm - blockW) / 2,
    gutterXMm: BC_GROOVE_MM,
    marginTopMm: (spec.blockHMm - blockH) / 2,
    gutterYMm: BC_GROOVE_MM,
  };
}

export interface CardRectMm { xMm: number; yMm: number; wMm: number; hMm: number; }

export interface BusinessCardFit {
  sheetWMm: number; sheetHMm: number;
  /** Every card, origin BOTTOM-LEFT (PDF), in the LAYOUT frame. */
  cells: CardRectMm[];
  n: number; cols: number; rows: number;
  marginXMm: number; marginTopMm: number; marginBottomMm: number; marginRightMm: number;
  gutterXMm: number; gutterYMm: number;
  cellWMm: number; cellHMm: number;
  blockWMm: number; blockHMm: number;
  /** The guillotine cut on a doubled stock, as an x in the layout frame. */
  cutXMm: number[];
  rotated: boolean;
  pageWMm: number; pageHMm: number;
}

export function fitBusinessCards(
  sheet: BusinessCardSheet = 'a4', t: BusinessCardTemplate = {},
): BusinessCardFit {
  const spec = SHEETS[sheet] ?? SHEETS.a4;
  const defs = sheetDefaults(sheet);
  const gX = t.gutterXMm ?? defs.gutterXMm;
  const gY = t.gutterYMm ?? defs.gutterYMm;
  const blockW = BC_COLS * BC_CARD_W_MM + (BC_COLS - 1) * gX;
  const blockH = spec.rows * BC_CARD_H_MM + (spec.rows - 1) * gY;
  /* A typed A or D wins; otherwise the block is centered on its sheet, which
     is exactly the template's 13.5 / 7.5. */
  const mX = t.marginXMm ?? (spec.blockWMm - blockW) / 2;
  const mTop = t.marginTopMm ?? (spec.blockHMm - blockH) / 2;
  const mBot = spec.hMm - mTop - blockH;

  const blockCells = (originXMm: number): CardRectMm[] => {
    const out: CardRectMm[] = [];
    for (let r = 0; r < spec.rows; r++) {
      for (let c = 0; c < BC_COLS; c++) {
        out.push({
          xMm: originXMm + mX + c * (BC_CARD_W_MM + gX),
          /* Rows read from the top, PDF y runs up. */
          yMm: spec.hMm - mTop - r * (BC_CARD_H_MM + gY) - BC_CARD_H_MM,
          wMm: BC_CARD_W_MM, hMm: BC_CARD_H_MM,
        });
      }
    }
    return out;
  };

  return {
    sheetWMm: spec.wMm, sheetHMm: spec.hMm,
    cells: spec.doubled ? [...blockCells(0), ...blockCells(spec.blockWMm)] : blockCells(0),
    n: (spec.doubled ? 2 : 1) * BC_COLS * spec.rows, cols: BC_COLS, rows: spec.rows,
    marginXMm: mX, marginTopMm: mTop, marginBottomMm: mBot,
    marginRightMm: spec.blockWMm - mX - blockW,
    gutterXMm: gX, gutterYMm: gY,
    cellWMm: BC_CARD_W_MM, cellHMm: BC_CARD_H_MM,
    blockWMm: blockW, blockHMm: blockH,
    cutXMm: spec.doubled ? [spec.blockWMm] : [],
    rotated: spec.rotated === true,
    pageWMm: spec.rotated ? spec.hMm : spec.wMm,
    pageHMm: spec.rotated ? spec.wMm : spec.hMm,
  };
}
