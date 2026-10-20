/* A4 Business Card Cutter — the card cutter's own "namecard" template.
 *
 * Their drawing (the manual, page 16, "namecard (85,89,90) x 54mm"): an A4
 * holds two columns of five 89 x 54 cards, each in a 92 x 57 FILE BOX — 1.5
 * past the cut on every side.
 *
 *   ACROSS   9.5 + 92 + 7 + 92 + 9.5 = 210: the file boxes 7 apart, so the
 *            cards are 10 apart and the cuts fall at 11 / 100 / 110 / 199.
 *            The block is centered — 11 each side.
 *   DOWN     5(57) + 4(3) = 297 exactly: the file boxes tile the sheet from
 *            the top edge, 3 apart, so the cards are 6 apart and the cuts
 *            fall at 1.5, 55.5, 61.5, 115.5, ... — first cut 1.5 from the
 *            head, then a 60 mm pitch.
 *   MARK     a 10 x 3 black bar at the top, centered in the column gap, for
 *            the machine's eye: it sees paper, then black, and indexes every
 *            cut off that step. Part of the template, so on by default.
 *
 * The heading's (85, 89, 90) are the card widths the machine can be set up
 * for; the drawing is the 89. The width is settable; the file box is always
 * the card + 3, the card gap stays 10, and the block stays centered.
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
 * THE MACHINE IS PROGRAMMED FOR A4 AND THE SHEET IN IT MAY NOT BE (owner:
 * Letter halves off an 11 x 17). The two passes reference the sheet
 * differently, and the template has to follow each:
 *
 *   ACROSS (pass 1, the slitting blades): fixed hardware either side of the
 *   machine's center line, and the rails center the sheet on it. So the
 *   block is CENTERED across whatever the sheet is — 11 from the edge on
 *   A4, 13.95 on Letter (5.9 wider). Blade positions are measured with the
 *   red cut lines, never assumed.
 *
 *   DOWN (pass 2, the cross-cut): the machine indexes off the LEADING EDGE
 *   (the mark, then the program's first cut and pitch) and knows nothing
 *   about the sheet's length. So the rows sit at those distances from the
 *   head on EVERY stock, never centered: the A4 layout, lined up with the
 *   top edge, and WHATEVER WOULD FALL OFF THE BOTTOM IS NOT PRINTED AT ALL
 *   (owner: "don't even worry about putting anything there"). On a Letter
 *   half (279.4) four rows are whole; the fifth would start at 241.5 and end
 *   at 295.5, so it is left off and the tail is blank. Centering the block
 *   on Letter (what the A4 drawing looks like) put every row off the blade.
 *   FEED THE HEAD EDGE IN FIRST: the end with the mark.
 *
 *   BACKS therefore mirror ACROSS only — the rows must stay at the program's
 *   distances from the back sheet's own leading edge, so the sheet turns over
 *   about its long edge (the layout's). On the stood-up doubled page that is
 *   the press's SHORT-edge flip, because page y is layout x there.
 *
 * THE CUTTER STEPS ONE CONSTANT PITCH, so there is a single row gutter here,
 * not one per row. The gutters place the CUTS; the art is laid at the file
 * size and never moves a cut. */

export const MM_PER_IN = 25.4;
export const PT_PER_MM = 72 / MM_PER_IN;

/** The card as cut, from the drawing: 89 x 54 (the machine also takes 85 and
 *  90 wide — `cardWMm`). */
export const BC_CARD_W_MM = 89;
export const BC_CARD_H_MM = 54;
export const BC_CARD_WIDTHS_MM = [85, 89, 90] as const;
/** File box = card + this on every side: 92 x 57. */
export const BC_BLEED_MM = 1.5;
export const BC_LAYOUT_W_MM = BC_CARD_W_MM + 2 * BC_BLEED_MM;   // 92
export const BC_LAYOUT_H_MM = BC_CARD_H_MM + 2 * BC_BLEED_MM;   // 57
/** Between the CARDS: 10 across (file boxes 7 apart), 6 down (boxes 3 apart). */
export const BC_GUTTER_X_MM = 10;
export const BC_GUTTER_Y_MM = 6;
/** Leading edge to the first cut: the first file box starts AT the edge. */
export const BC_FRONT_MM = BC_BLEED_MM;                         // 1.5
/** The mark the eye reads: 10 x 3, at the top, centered in the column gap. */
export const BC_MARK_W_MM = 10;
export const BC_MARK_H_MM = 3;
export const BC_MARK_INSET_MM = 1.5;
/** Past the file box the art's edge is carried outward across the margin to
 *  this far (or the paper's edge), and to mid-gap between cards, as
 *  registration tolerance. */
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
  /** Card width as the machine is set up: 85, 89 (the drawing) or 90. */
  cardWMm?: number;
}

/** The A4 program's rows — laid on every stock. */
export const BC_ROWS = 5;

interface SheetSpec {
  wMm: number; hMm: number; blockWMm: number;
  doubled: boolean; rotated?: boolean;
}

const SHEETS: Record<BusinessCardSheet, SheetSpec> = {
  a4:      { wMm: A4_W_MM, hMm: A4_H_MM, blockWMm: A4_W_MM, doubled: false },
  a3:      { wMm: A3_W_MM, hMm: A3_H_MM, blockWMm: A4_W_MM, doubled: true, rotated: true },
  letter:  { wMm: LETTER_W_MM, hMm: LETTER_H_MM, blockWMm: LETTER_W_MM, doubled: false },
  tabloid: { wMm: TABLOID_W_MM, hMm: LETTER_H_MM, blockWMm: LETTER_W_MM, doubled: true, rotated: true },
};

/** Rows laid in one block: always the A4 program's five. */
export function rowsFor(_sheet: BusinessCardSheet): number { return BC_ROWS; }

/** Rows that are WHOLE on this stock, from the head at the program's figures. */
export function wholeRowsFor(sheet: BusinessCardSheet, t: BusinessCardTemplate = {}): number {
  const spec = SHEETS[sheet] ?? SHEETS.a4;
  const d = sheetDefaults(sheet, t.cardWMm);
  const mTop = t.marginTopMm ?? d.marginTopMm, gY = t.gutterYMm ?? d.gutterYMm;
  let n = 0;
  while (n < BC_ROWS && mTop + (n + 1) * BC_CARD_H_MM + n * gY <= spec.hMm + 1e-6) n++;
  return n;
}

/** The template's own figures for a stock: the block CENTERED ACROSS (the
 *  slitting blades sit either side of the machine's center line), and the
 *  rows FROM THE LEADING EDGE at the program's Front len (the cross-cut
 *  indexes off the edge). On A4 both come out as the drawing: 13.5 / 7.5. */
export function sheetDefaults(sheet: BusinessCardSheet = 'a4', cardWMm = BC_CARD_W_MM): Required<BusinessCardTemplate> {
  const spec = SHEETS[sheet] ?? SHEETS.a4;
  const blockW = BC_COLS * cardWMm + (BC_COLS - 1) * BC_GUTTER_X_MM;
  return {
    marginXMm: (spec.blockWMm - blockW) / 2,
    gutterXMm: BC_GUTTER_X_MM,
    marginTopMm: BC_FRONT_MM,
    gutterYMm: BC_GUTTER_Y_MM,
    cardWMm,
  };
}

export interface CardRectMm { xMm: number; yMm: number; wMm: number; hMm: number; }

export interface BusinessCardFit {
  sheetWMm: number; sheetHMm: number;
  /** Every card that is WHOLE on the sheet, origin BOTTOM-LEFT (PDF), in the
   *  LAYOUT frame. A row of the program that would run off the foot is not
   *  laid at all. */
  cells: CardRectMm[];
  /** Whole cards on the sheet; cols; rows laid (5) and rows whole. */
  n: number; cols: number; rows: number; wholeRows: number;
  marginXMm: number; marginTopMm: number; marginBottomMm: number; marginRightMm: number;
  gutterXMm: number; gutterYMm: number;
  cellWMm: number; cellHMm: number;
  blockWMm: number; blockHMm: number;
  /** The guillotine cut on a doubled stock, as an x in the layout frame. */
  cutXMm: number[];
  /** Where each block's mark sits: the center of its column gap, as an x. */
  markXMm: number[];
  rotated: boolean;
  pageWMm: number; pageHMm: number;
}

export function fitBusinessCards(
  sheet: BusinessCardSheet = 'a4', t: BusinessCardTemplate = {},
): BusinessCardFit {
  const spec = SHEETS[sheet] ?? SHEETS.a4;
  const cardW = t.cardWMm ?? BC_CARD_W_MM;
  const defs = sheetDefaults(sheet, cardW);
  const gX = t.gutterXMm ?? defs.gutterXMm;
  const gY = t.gutterYMm ?? defs.gutterYMm;
  const whole = wholeRowsFor(sheet, t);
  const blockW = BC_COLS * cardW + (BC_COLS - 1) * gX;
  /* The block that is ON the sheet: the whole rows. H is measured to it. */
  const blockH = whole * BC_CARD_H_MM + Math.max(0, whole - 1) * gY;
  /* A typed A or D wins; otherwise A centers the block across and D is the
     program's Front len from the leading edge — see the header. */
  const mX = t.marginXMm ?? defs.marginXMm;
  const mTop = t.marginTopMm ?? defs.marginTopMm;
  const mBot = spec.hMm - mTop - blockH;

  const blockCells = (originXMm: number): CardRectMm[] => {
    const out: CardRectMm[] = [];
    for (let r = 0; r < whole; r++) {
      for (let c = 0; c < BC_COLS; c++) {
        out.push({
          xMm: originXMm + mX + c * (cardW + gX),
          /* Rows read from the top, PDF y runs up. */
          yMm: spec.hMm - mTop - r * (BC_CARD_H_MM + gY) - BC_CARD_H_MM,
          wMm: cardW, hMm: BC_CARD_H_MM,
        });
      }
    }
    return out;
  };

  return {
    sheetWMm: spec.wMm, sheetHMm: spec.hMm,
    cells: spec.doubled ? [...blockCells(0), ...blockCells(spec.blockWMm)] : blockCells(0),
    n: (spec.doubled ? 2 : 1) * BC_COLS * whole, cols: BC_COLS, rows: BC_ROWS, wholeRows: whole,
    marginXMm: mX, marginTopMm: mTop, marginBottomMm: mBot,
    marginRightMm: spec.blockWMm - mX - blockW,
    gutterXMm: gX, gutterYMm: gY,
    cellWMm: cardW, cellHMm: BC_CARD_H_MM,
    blockWMm: blockW, blockHMm: blockH,
    cutXMm: spec.doubled ? [spec.blockWMm] : [],
    markXMm: (spec.doubled ? [0, spec.blockWMm] : [0]).map((o) => o + mX + cardW + gX / 2),
    rotated: spec.rotated === true,
    pageWMm: spec.rotated ? spec.hMm : spec.wMm,
    pageHMm: spec.rotated ? spec.wMm : spec.hMm,
  };
}
