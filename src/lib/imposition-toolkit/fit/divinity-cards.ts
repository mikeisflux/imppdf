/* Divinity trading cards — one card artwork ganged 8-up on a Letter or A4 sheet
 * and the block duplicated onto 11 x 17 / A3, so one sheet cuts in half into
 * two identical singles to run.
 *
 * THE CELL IS THE CARD AS THE BLADES CUT IT. The panel says 89 x 63; on Letter
 * the red cut lines showed the blades bracketing 91 and 90.5 (the two pairs
 * are mounted one by one and differ), so that is the cell. Near enough a
 * 2.5 x 3.5" card (88.9 x 63.5) either way — but the machine's figure governs,
 * because the machine is what does the cutting, and the blade governs over
 * the panel. Never derived and never nudged to make a margin come out.
 *
 * THE LETTER TEMPLATE is the manufacturer's A4 drawing converted for Letter
 * stock in a machine hard-wired for A4, then honed over six test cuts with the
 * red cut lines to what the blades actually do:
 *
 *     across  A 15.45 + 91 + B 9 + 90.5 + C 9.95 = 215.9
 *     down    D 5.9 + 4(63) + 3(3.2) + H 11.9   = 279.4
 *
 * (The shop's earlier hand-measured template — A 17.45 / B 3 / D 7.6 / E F G
 * 3 — was retired once this was honed; A4 and A3 still start from those
 * figures as DEF_*, having never been honed on this machine.)
 *
 * CUT PIECES MUST BE 8, NOT 10. At a 63 mm card length five rows need more than
 * Letter (279.4) OR A4 (297) — the machine was left set to ten, so after the
 * eight that fit it goes looking for a fifth row that cannot exist on any sheet
 * it takes.
 *
 * EVERY GAP IS A SETTING, and C and H can be typed as readily as A and D — they
 * are the far end of the same two spans, so entering one just places the block
 * from that edge instead. There is still only ONE degree of freedom per axis:
 * A + block + C must equal the sheet.
 *
 * THE GUTTERS ARE THE MACHINE'S, NOT MEASUREMENTS OFF ITS OUTPUT. The cutter
 * advances one constant pitch and repeats it, so the file has to step exactly
 * that or the blade walks into the art a little further on every row. An
 * earlier set (0 / 0.7 / 0.7) was measured off cut sheets, but what was being
 * measured was the drift between file and machine, not any gutter the machine
 * was cutting.
 *
 * EVERY GAP HERE IS A CUT LINE, not white paper. The manufacturer's template
 * lays the art at 92 x 66 against an 89 x 63 card, so it runs 1.5 past the cut
 * on all four sides. The gutters below still place the CUTS — the bleed is
 * drawn outside them and moves nothing.
 *
 * THE ROW GAPS E, F, G MUST STAY EQUAL — see the note at DEF_GUTTER_E_MM. They
 * are still three settings so an operator can prove a machine wrong, but a
 * slitter steps one pitch and unequal values cannot describe it. Change one and
 * H closes up by exactly that much: D stays where it is and the block grows
 * downward.
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
   measured a correct A4 all the way through and the paper was never A4.       */
export const LETTER_W_MM = 8.5 * MM_PER_IN;    // 215.9
export const LETTER_H_MM = 11 * MM_PER_IN;     // 279.4
export const TABLOID_W_MM = 17 * MM_PER_IN;    // 431.8 — two Letters side by side
export const A4_W_MM = 210, A4_H_MM = 297;
export const A3_W_MM = 420, A3_H_MM = 297;

const COLS_N = 2, ROWS_N = 4;

/* ── THE MACHINE'S OWN PROGRAM, read straight off the 2102-F's panel. These are
   not measurements of its output and not preferences — they are the numbers the
   cutter is set to, and the file exists to agree with them:

       Norm sel     Frontal    indexes off the leading edge — no mark
       Front len    7.6 mm     leading edge to the first cut
       Card len      63 mm     the feed direction
       Groove len   3.0 mm
       Cut pieces  0010        (see the note above — it should be 8)
       Groove / Card / Frontal / Mark posit comp   all +0.000

   Everything else on this sheet falls out of them. Change one here only when it
   has been changed on the machine. ───────────────────────────────────────── */

/** The cell IS the machine's card: 89 wide, 63 in the feed direction. Near
 *  enough a 2.5 x 3.5" card (88.9 x 63.5) that the difference is the panel
 *  rounding to whole millimetres — but the MACHINE'S figure is the one that
 *  governs, because the machine is what does the cutting. */
export const MACHINE_CARD_W_MM = 89;
export const MACHINE_CARD_L_MM = 63;
/** Groove len on the panel. */
export const MACHINE_GROOVE_MM = 3;
/** Front len on the panel. */
export const MACHINE_FRONT_MM = 7.6;

/* ── THE MANUFACTURER'S TEMPLATE, an A4 drawn to the millimetre and captioned:

       "虚线是切卡机的刀的位置，实际排版不需要的。卡片尺寸89X63，排版尺寸是92X66"
       "The dashed line is where the card cutter's blade goes — don't include it
        in the actual layout. Card size 89x63, LAYOUT SIZE 92x66."

   and dimensioned:  92 / 89 across, 66 / 63 down, 10.00 between the two
   layout boxes, 6.00 between the cut lines row to row.

   THIS IS WHERE THE BLADES ARE. Across, the machine has a fixed set of slitting
   blades and the template is a drawing of them: on A4 the cuts fall at
   9.5 / 98.5 / 111.5 / 200.5 — 13 mm apart in the middle, NOT the 3 mm groove.
   Reading the groove as the column gap is exactly what put the outer blades
   5 mm outside the art and the inner ones 5 mm into it: 10 mm of missing gap,
   halved. The right-hand cards lost their heading, the left-hand ones came out
   with a white edge, and the width of that white was the number that gave it
   away. ───────────────────────────────────────────────────────────────────── */

/** The layout box runs this far past the cut on every side (92 − 89 = 3, halved). */
export const LAYOUT_BLEED_MM = 1.5;
export const LAYOUT_W_MM = MACHINE_CARD_W_MM + 2 * LAYOUT_BLEED_MM;   // 92
export const LAYOUT_L_MM = MACHINE_CARD_L_MM + 2 * LAYOUT_BLEED_MM;   // 66

/** A4 edge to the layout box, and between the two layout boxes — the
 *  template's own figures. */
export const TEMPLATE_A4_EDGE_MM = 8;
export const TEMPLATE_COL_GAP_MM = 10;
/** Between the CUT lines, row to row, as the template draws it. NOT what this
 *  machine cuts: it is programmed Groove 3 and it steps 66, and a sheet cut at
 *  the template's 69 came back with the white growing row by row — none on
 *  row 1, 1.5 on row 2, 3 on row 3, 3 plus a sliver of the previous card on
 *  row 4, which is exactly 3 mm of pitch error compounding. The feed direction
 *  is the panel's, and this figure is kept only as a record of the drawing. */
export const TEMPLATE_ROW_CUT_GAP_MM = 6;
/** Between the CUT lines across: the layout gap plus a bleed on each side. */
export const TEMPLATE_COL_CUT_GAP_MM = TEMPLATE_COL_GAP_MM + 2 * LAYOUT_BLEED_MM;   // 13

/** THE BLADES AS DRAWN, either side of the machine's centre line: A4 is 210
 *  wide, the first cut is 8 + 1.5 in, so it sits 105 − 9.5 = 95.5 from centre;
 *  the inner pair straddle the 13 mm gap at ±6.5. */
export const TEMPLATE_BLADE_INNER_MM = TEMPLATE_COL_CUT_GAP_MM / 2;                 // 6.5
export const TEMPLATE_BLADE_OUTER_MM = TEMPLATE_BLADE_INNER_MM + MACHINE_CARD_W_MM; // 95.5

/** THE BLADES AS THEY ARE — the four slitting blades on a Letter sheet, from
 *  its left edge, honed with the red cut lines over six sheets:
 *
 *    cut to 13 / 89      full red on BOTH inner edges, thin on both outer
 *    cut to 11 / 89      ~1 mm red down every LEFT edge, none on the right
 *    moved 1 mm left     ~1 mm red down every RIGHT edge, none on the left
 *    cut to 90 / 10      ~0.5 red down every RIGHT edge
 *    cut to 90.5 / 9.5   a thin line down the LEFT column's inner edge only
 *
 *  The second and third are the tell: a shift moves red from one side to the
 *  other only if the card is cut WIDER than the cell. The left blades have
 *  sat exactly on 15.45 and 115.45 from the third sheet on (red there only
 *  when a line was moved off them); the right blades grew as the width was
 *  chased — and the last sheet showed the two pairs are NOT the same width.
 *  Blades are mounted one by one, so they need not be: left pair 91, right
 *  pair 90.5, 9 between. So the four positions are simply recorded as
 *  measured and everything else falls out of them. The panel's 89 is
 *  nominal; the machine cuts what its blades are set to. Hardware, and it
 *  does not move with the sheet — lock rails both sides (owner: "placement
 *  is not an issue"). The shop's `letter` template keeps its 89. */
export const LETTER_BLADES_MM = [15.45, 106.45, 115.45, 205.95] as const;
/** The two cards across as the blades cut them — left column, right column. */
export const MACHINE_CARD_W_AS_CUT_MM = [
  LETTER_BLADES_MM[1] - LETTER_BLADES_MM[0], LETTER_BLADES_MM[3] - LETTER_BLADES_MM[2],
] as const;                                                                // 91, 90.5
export const MACHINE_COL_GAP_MM = LETTER_BLADES_MM[2] - LETTER_BLADES_MM[1];   // 9
/** A on Letter: the first blade. */
export const LETTER_MARGIN_X_MM = LETTER_BLADES_MM[0];                         // 15.45

/** THE FEED AS IT LANDS: the panel says Front len 7.6 and Groove 3; the blade
 *  lands at 5.9 and steps 66.2. Read off the red lines on a sheet cut at
 *  6.4 / 66: 0.5 of red along the TOP of row 1, thinner on rows 2 and 3, none
 *  on row 4 — and then red along the BOTTOM of row 4 only. Tops shrinking
 *  down the sheet while a bottom appears at the end is a pitch a fraction
 *  longer than the file's: 0.5 − 0.2r on the tops, −0.5 + 0.2r on the
 *  bottoms, which is 66.2 a row from 5.9. (7.6 → 6.9 → 6.4 before that were
 *  the same thing read as a shift, the pitch error being under what a photo
 *  shows.) The panel's "Frontal comp" and "Groove len comp" would do the
 *  same on the machine. This is NOT the drift-chasing the rule below forbids:
 *  that measured the art against the cut and fed the difference back as a
 *  gutter; this reads a signature that only a pitch can make. */
export const FRONT_OFFSET_MM = -1.7;
export const MACHINE_FRONT_AS_CUT_MM = MACHINE_FRONT_MM + FRONT_OFFSET_MM;   // 5.9
export const MACHINE_GROOVE_AS_CUT_MM = 3.2;                                 // pitch 66.2

/** OUTER bleed — how far the art's edge is carried past the cuts on the
 *  OUTSIDE of the block, where there is no neighbour to meet and nothing but
 *  margin beyond. It is registration tolerance for a sheet centred by hand: an
 *  outer blade that lands a couple of millimetres out still lands in ink.
 *  Between two cards the same carry runs to the MIDDLE of the gap from each
 *  side, so a lateral shift up to half the gap shows no white anywhere.
 *
 *  The art itself is NOT stretched to it — the art is laid at the layout size
 *  and this zone is its outermost sliver drawn out, so the card's crop is the
 *  template's on every card and every edge. Clamped to the margin available. */
export const OUTER_BLEED_MM = 8;
/** How much of the art's edge is drawn out across that outer zone: a sliver,
 *  so it reads as the border carried on rather than a smeared picture. */
export const STREAK_MM = 0.5;
/** How far every carried strip is drawn PAST its slot on every side, under
 *  the layout boxes and under each other, so no two clipped draws merely
 *  touch: two edges that only meet leave a hairline of paper in a viewer
 *  (and on some RIPs), right across the art. Bleed only — a strip reaches
 *  this far into a layout box and never into a cell. */
export const SEAM_MM = 0.3;

/* ── The shop's original hand-measured template. Letter no longer uses it (see
   LETTER_TEMPLATE); A4 and A3 still start from it, never having been honed on
   this machine. Nothing here is centred, derived from a rule, or clever: the
   operator has a ruler and the machine, and inferring this instead of exposing
   it produced twenty rounds of wrong sheets.

   A and B place the columns; D, E, F and G place the rows. C and H are then what
   is left over — there is one degree of freedom per axis, because A, the cards
   and C have to sum to the sheet. The panel shows C and H live so the operator
   can see what a change did.                                                  */
export const DEF_MARGIN_X_MM = 17.45; // A — sheet edge to the first cut line (the remainder, halved)
export const DEF_MARGIN_TOP_MM = MACHINE_FRONT_MM;  // D — the panel's Front len

export const DEF_GUTTER_X_MM = MACHINE_GROOVE_MM;  // B — the panel's Groove len

/* E, F and G: the three gaps BETWEEN THE ROWS, top to bottom. Each is its own
   setting because every crack on the sheet has its own letter and its own box:
   the operator measures three gaps with a ruler, not one gap three times.

   ALL THREE ARE THE MACHINE'S GUTTER, AND THEY MUST STAY EQUAL. The cutter is a
   slitter: it advances ONE constant pitch per row (card + gutter) and repeats.
   It cannot cut 0 then 0.7 then 0.7, so a template that says so can only ever
   disagree with it — and the disagreement compounds down the sheet.

   The old 0 / 0.7 / 0.7 came from measuring cut sheets, but those measurements
   were never the machine's gutters: they were the DRIFT between where the file
   put the art and where the machine put the blade. Feeding them back in chased
   a moving target, which is why the numbers never settled. */
export const DEF_GUTTER_E_MM = MACHINE_GROOVE_MM;  // E — row 1 to row 2
export const DEF_GUTTER_F_MM = MACHINE_GROOVE_MM;  // F — row 2 to row 3
export const DEF_GUTTER_G_MM = MACHINE_GROOVE_MM;  // G — row 3 to row 4

/* ── The black BAR for a slitter's mark mode (the 2102-F has exactly two modes,
   "frontal" and "mark"). One eye at the throat sees paper, then black, and
   indexes every programmed cut off that step. OFF everywhere by default — the
   machine runs frontal and the owner's word is that the bar is not needed. The
   figures are kept as settings for the day it is. */
export const REG_MARK_INSET_MM = 3;      // feed edge to the bar
export const REG_MARK_DEPTH_MM = 3;      // bar depth, in the feed direction
/** White pad drawn round the bar, so the eye sees a clean paper-to-black step
 *  even when the background flood is on. */
export const REG_MARK_PAD_MM = 1.5;
/** What the bar and its pad occupy from the feed edge: 3 + 3 + 1.5. A head
 *  margin at least this deep keeps the first cut off the mark. */
export const REG_HEAD_MM = REG_MARK_INSET_MM + REG_MARK_DEPTH_MM + REG_MARK_PAD_MM;   // 7.5

/** The cell: the card laid sideways. Never derived, never adjusted to make a
 *  margin come out — the cell IS the cut size. */
export const PLACED_W_MM = MACHINE_CARD_W_MM;   // 89
export const PLACED_H_MM = MACHINE_CARD_L_MM;   // 63

export const COLS = COLS_N;
export const ROWS = ROWS_N;

export interface DivinityCardTemplate {
  /** A — sheet edge to the first cut line. */ marginXMm?: number;
  /** B — between the columns. */              gutterXMm?: number;
  /** D — head margin. */                      marginTopMm?: number;
  /** E — row 1 to row 2. */                   gutterEMm?: number;
  /** F — row 2 to row 3. */                   gutterFMm?: number;
  /** G — row 3 to row 4. */                   gutterGMm?: number;
}

/** 'letter' / 'a4' hold one block; 'tabloid' / 'a3' hold two side by side and
 *  cut into two of the smaller sheet. The doubled pair come out PORTRAIT: the
 *  layout is reasoned about landscape and the finished page stood up, so their
 *  cut runs across the page rather than down it. Nothing from this tool is
 *  landscape (owner). */
export type DivinityCardSheet = 'letter' | 'tabloid' | 'a4' | 'a3';

interface SheetSpec {
  wMm: number; hMm: number; blockWMm: number; doubled: boolean;
  /** Turn the finished PAGE a quarter turn, so the layout below is laid out
   *  landscape and then stood up. Everything in this module stays in the
   *  landscape frame — A, B, C, D and the cells are unchanged — and only the
   *  page the caller draws onto is portrait. */
  rotated?: boolean;
  /** Centre the block ACROSS instead of using the measured A. The machine's
   *  blades are symmetric about its centre line, so a sheet centred in it wants
   *  its block centred too — a typed A still wins. */
  centred?: boolean;
  /** Turn registration marks on for this sheet by default. */
  regTest?: boolean;
  /** Paint every cut line in red, full width, ON TOP of the art — the honing
   *  diagnostic: a cut sheet then shows where the file put each cut against
   *  where the blade went. It honed the Letter Test over six sheets and is
   *  now OFF (owner: "remove the red at this point"); the caller can ask for
   *  it again with `showCuts` if the machine is ever re-bladed. */
  showCuts?: boolean;
  /** The card ACROSS as this stock's blades cut it, where it differs from the
   *  panel's figure — one figure, or one per column, since the two blade pairs
   *  need not match. The cell is what the blade does, not what the panel says. */
  cellWMm?: number | readonly [number, number];
  /** This stock's own gutters, where they differ from the shop template. */
  template?: DivinityCardTemplate;
}
/** Width of that red cut line. It lies entirely OUTSIDE the cell — its inner
 *  edge IS the cut line — so a blade on the line leaves no red on the card at
 *  all, and any red that does come through is the overshoot, exact width.
 *  (Centred on the line it left 1.5 on every edge of a perfect cut, which had
 *  to be subtracted by eye before the sheet could be read.)
 *  1, down from 3 (owner, "shrink the red down to 1mm and let's hone it in"):
 *  once the error is under a millimetre a wide band only says "some", and a
 *  narrow one that is either there or not is the finer gauge. Past 1 mm the
 *  art's carried edge shows beyond the red, which still reads as "over". */
export const CUT_LINE_MM = 1;
/** THE LETTER TEMPLATE — every gap as honed, shared by Letter and by each half
 *  of an 11 x 17, which is two Letters side by side and has to cut as two. */
const LETTER_TEMPLATE: DivinityCardTemplate = {
  marginXMm: LETTER_MARGIN_X_MM, gutterXMm: MACHINE_COL_GAP_MM, marginTopMm: MACHINE_FRONT_AS_CUT_MM,
  gutterEMm: MACHINE_GROOVE_AS_CUT_MM, gutterFMm: MACHINE_GROOVE_AS_CUT_MM, gutterGMm: MACHINE_GROOVE_AS_CUT_MM,
};
const SHEETS: Record<DivinityCardSheet, SheetSpec> = {
  /* LETTER — the manufacturer's A4 template, converted for a Letter sheet
     sitting in a machine that is hard-wired for A4, then honed.

     Across, the blades are hardware and never move: on A4 the template puts the
     cuts at 9.5 / 98.5 / 111.5 / 200.5, which is ±6.5 and ±95.5 either side of
     the machine's centre line. A Letter sheet centred on that same line meets
     them at 12.45 / 101.45 / 114.45 / 203.45 — so B is 13, not 3, and A = C =
     12.45. (`centred` gets exactly that: the block is 191 wide.)

     Then, off test cuts with the red lines on, the four blades are simply
     where they are — LETTER_BLADES_MM, 15.45 / 106.45 / 115.45 / 205.95 —
     so A 15.45, the cells 91 and 90.5, B 9, C 9.95.

     Down, the leading edge is the reference so the sheet's length does not
     matter: the first cut lands at 5.9 and the rows step 66.2 (red lines
     again — see MACHINE_GROOVE_AS_CUT_MM). The template's 6 is NOT this
     machine (see TEMPLATE_ROW_CUT_GAP_MM).

     No mark. Frontal mode indexes off the leading edge, and the owner's word is
     that the bar is not needed; the marks stay available on the switch. This
     was the "Letter Test" stock while it was being honed; once honed it was
     promoted to THE Letter stock and the hand-measured one retired (owner). */
  letter:  { wMm: LETTER_W_MM,  hMm: LETTER_H_MM, blockWMm: LETTER_W_MM, doubled: false,
             cellWMm: MACHINE_CARD_W_AS_CUT_MM, template: LETTER_TEMPLATE },
  /* 11 x 17 comes out PORTRAIT — 279.4 x 431.8 — with the two blocks and the
     cut between them turned a quarter turn onto it. The cards keep exactly the
     orientation they have on a Letter sheet relative to the block; it is the
     page that stands up, so the half-sheet cut runs ACROSS the portrait page at
     215.9 from the foot instead of down it. Each half IS a Letter sheet to the
     cutter, so it carries the Letter template and cells. */
  tabloid: { wMm: TABLOID_W_MM, hMm: LETTER_H_MM, blockWMm: LETTER_W_MM, doubled: true, rotated: true,
             cellWMm: MACHINE_CARD_W_AS_CUT_MM, template: LETTER_TEMPLATE },
  a4:      { wMm: A4_W_MM,      hMm: A4_H_MM,     blockWMm: A4_W_MM,     doubled: false },
  /* A3 stands up the same way — 297 x 420. NOTHING FROM THIS TOOL COMES OUT
     LANDSCAPE (owner). */
  a3:      { wMm: A3_W_MM,      hMm: A3_H_MM,     blockWMm: A4_W_MM,     doubled: true, rotated: true },
};

/** The cell width of each column: one figure for both, or one each. */
const cellWidths = (w: number | readonly [number, number] | undefined): number[] =>
  Array.isArray(w) ? [...w] : Array<number>(COLS_N).fill((w as number | undefined) ?? PLACED_W_MM);

/** Every gap a stock starts from, A B D E F G, before the operator types over
 *  any of them. The panel shows these as the field defaults and the reset
 *  target, so what it quotes is what the engine uses. */
export function sheetDefaults(sheet: DivinityCardSheet = 'letter'): Required<DivinityCardTemplate> {
  const spec = SHEETS[sheet] ?? SHEETS.letter;
  const t = spec.template ?? {};
  const gX = t.gutterXMm ?? DEF_GUTTER_X_MM;
  const blockW = cellWidths(spec.cellWMm).reduce((a, b) => a + b, 0) + (COLS_N - 1) * gX;
  return {
    marginXMm: t.marginXMm ?? (spec.centred ? (spec.blockWMm - blockW) / 2 : DEF_MARGIN_X_MM),
    gutterXMm: gX,
    marginTopMm: t.marginTopMm ?? DEF_MARGIN_TOP_MM,
    gutterEMm: t.gutterEMm ?? DEF_GUTTER_E_MM,
    gutterFMm: t.gutterFMm ?? DEF_GUTTER_F_MM,
    gutterGMm: t.gutterGMm ?? DEF_GUTTER_G_MM,
  };
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
  /** B as set. */
  gutterXMm: number;
  /** The cell this stock cuts, across and down — and across per column, since
   *  the two blade pairs need not be the same width. */
  cellWMm: number; cellWsMm: number[]; cellHMm: number;
  /** The block itself — the cards plus the gutters between them. Reported so a
   *  caller can work back from C or H to A or D without restating the sums. */
  blockWMm: number; blockHMm: number;
  /** E, F and G as set, top to bottom. Reported so the panel can label the three
   *  row gaps without recomputing which setting landed where. */
  rowGapsMm: [number, number, number];
  /** Where an A3 is cut into two A4s, as an x DOWN the sheet. Empty for a plain
   *  A4. The blocks sit side by side, so the cut is vertical. */
  cutXMm: number[];
  /** True when the PAGE is a quarter turn from the layout above: every figure
   *  in this fit is in the landscape frame, and the caller stands the finished
   *  page up. pageWMm / pageHMm are what the PDF page actually measures. */
  rotated: boolean;
  pageWMm: number; pageHMm: number;
  /** This stock wants registration marks unless the caller says otherwise. */
  regTest: boolean;
  /** This stock paints its cut lines in red over the art. */
  showCuts: boolean;
}

export function fitDivinityCards(
  sheet: DivinityCardSheet = 'letter', t: DivinityCardTemplate = {},
): DivinityCardFit {
  const spec = SHEETS[sheet] ?? SHEETS.letter;
  const defs = sheetDefaults(sheet);
  const gX = t.gutterXMm ?? defs.gutterXMm;
  /* E, F, G top to bottom — three separate gaps, not one repeated. */
  const rowGaps: [number, number, number] = [
    t.gutterEMm ?? defs.gutterEMm,
    t.gutterFMm ?? defs.gutterFMm,
    t.gutterGMm ?? defs.gutterGMm,
  ];

  /* The block's own size never moves — it is COLS cards plus the gutters. What
     the settings decide is where on the sheet it sits. */
  const cellWs = cellWidths(spec.cellWMm);
  const blockW = cellWs.reduce((a, b) => a + b, 0) + (COLS - 1) * gX;
  const blockH = ROWS * PLACED_H_MM + rowGaps[0] + rowGaps[1] + rowGaps[2];

  /* On the centred stock A falls out of the block rather than being read off
     the machine — but a typed value still wins, so the operator can nudge it
     after a test cut. The centring has to use THIS fit's B, not the default's,
     or a typed B would push the block off centre. */
  const mX = t.marginXMm ?? (spec.centred ? (spec.blockWMm - blockW) / 2 : defs.marginXMm);
  const mTop = t.marginTopMm ?? defs.marginTopMm;
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
          xMm: originXMm + mX + cellWs.slice(0, c).reduce((a, b) => a + b, 0) + c * gX,
          /* Rows are numbered from the TOP of the sheet, the way a spec sheet
             reads, but PDF y runs up — so row 0 is the highest y. */
          yMm: spec.hMm - rowTop(r) - PLACED_H_MM,
          wMm: cellWs[c]!, hMm: PLACED_H_MM,
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
    marginRightMm: spec.blockWMm - mX - blockW, gutterXMm: gX,
    cellWMm: cellWs[0]!, cellWsMm: cellWs, cellHMm: PLACED_H_MM,
    blockWMm: blockW, blockHMm: blockH,
    rowGapsMm: rowGaps,
    cutXMm: spec.doubled ? [spec.blockWMm] : [],
    rotated: spec.rotated === true,
    regTest: spec.regTest === true,
    showCuts: spec.showCuts === true,
    pageWMm: spec.rotated ? spec.hMm : spec.wMm,
    pageHMm: spec.rotated ? spec.wMm : spec.hMm,
  };
}
