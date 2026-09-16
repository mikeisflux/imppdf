/* Divinity trading cards — one card artwork ganged 8-up on A4 and the block
 * duplicated onto A3, so one A3 cuts in half into two identical A4s to run.
 *
 * THE CELL IS THE MACHINE'S CARD: 89 x 63, read off the cutter's own panel.
 * That is near enough a 2.5 x 3.5" card (88.9 x 63.5) that the difference is the
 * panel rounding to whole millimetres — but the machine's figure governs,
 * because the machine is what does the cutting. Never derived and never nudged
 * to make a margin come out.
 *
 * B IS 3, THE SAME AS THE ROW GUTTER — both are the panel's Groove len.
 *
 * CUT PIECES MUST BE 8, NOT 10. At a 63 mm card length five rows need 334.6 mm,
 * which does not fit Letter (279.4) OR A4 (297) — the machine was left set to
 * ten, so after the eight that fit it goes looking for a fifth row that cannot
 * exist on any sheet it takes.
 *
 * EVERY GAP IS A SETTING, and C and H can be typed as readily as A and D — they
 * are the far end of the same two spans, so entering one just places the block
 * from that edge instead. There is still only ONE degree of freedom per axis:
 * A + block + C must equal the sheet.
 *
 * THE VALIDATED TEMPLATE, measured off PRODUCTION stock and confirmed on a cut
 * stack:
 *
 *     A 17.45   B 3   D 7.6   E F G 3   sheet LETTER
 *     C and H then fall out at 17.45 and 10.80.
 *
 *     across  17.45 + 89 + 3 + 89 + 17.45  = 215.9
 *     down    7.6 + 4(63) + 3(3) + 10.8    = 279.4
 *
 * THE GUTTERS ARE THE MACHINE'S, NOT MEASUREMENTS OFF ITS OUTPUT. The cutter
 * advances one constant pitch — card + 3 — and repeats it, so the file has to
 * step exactly that or the blade walks into the art a little further on every
 * row. An earlier set (0 / 0.7 / 0.7) was measured off cut sheets, but what was
 * being measured was the drift between file and machine, not any gutter the
 * machine was cutting.
 *
 * EVERY GAP HERE IS A CUT LINE, not white paper. The manufacturer's template
 * lays the art at 92 x 66 against an 89 x 63 card, so it runs half the groove
 * (1.5) past the cut on all four sides; two neighbours meet in the middle of the
 * groove and the blade cuts through ink. The gutters below still place the CUTS
 * — the bleed is drawn outside them and moves nothing.
 *
 * THE ROW GAPS ARE 3, 3, 3 and MUST STAY EQUAL — see the note at DEF_GUTTER_E_MM.
 * They are still three settings so an operator can prove a machine wrong, but a
 * slitter steps one pitch and unequal values cannot describe it. Change one and
 * H closes up by exactly that much: D stays where it is and the block grows
 * downward.
 *
 * A EQUALS C NOW, and D equals H. The lopsided sets that came before were hand
 * compensation for feed drift in frontal mode — and that drift was really the
 * pitch mismatch above. With the file stepping what the machine steps there is
 * nothing to compensate for, so the block is simply centred and the leftovers
 * fall where they fall.
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
 *  cut into two of the smaller sheet. The doubled pair come out PORTRAIT: the
 *  layout is reasoned about landscape and the finished page stood up, so their
 *  cut runs across the page rather than down it. Nothing from this tool is
 *  landscape (owner). */
export type DivinityCardSheet = 'letter' | 'letterreg' | 'tabloid' | 'a4' | 'a3';

interface SheetSpec {
  wMm: number; hMm: number; blockWMm: number; doubled: boolean;
  /** Turn the finished PAGE a quarter turn, so the layout below is laid out
   *  landscape and then stood up. Everything in this module stays in the
   *  landscape frame — A, B, C, D and the cells are unchanged — and only the
   *  page the caller draws onto is portrait. */
  rotated?: boolean;
  /** Centre the block instead of using the measured A and D. Only the
   *  registration-test sheet does this: once a camera finds the marks the
   *  machine locates the art optically, so the lopsided A/C compensation — which
   *  exists to fight blind-feed drift — is no longer what you want. */
  centred?: boolean;
  /** Turn registration marks on for this sheet by default. */
  regTest?: boolean;
}
const SHEETS: Record<DivinityCardSheet, SheetSpec> = {
  letter:  { wMm: LETTER_W_MM,  hMm: LETTER_H_MM, blockWMm: LETTER_W_MM, doubled: false },
  /* THE REGISTRATION TEST SHEET. A Letter sheet, same eight cards, same cell —
     but the block is CENTRED so there is equal paper at all four corners for the
     camera marks, and the marks are on by default. It is a separate stock rather
     than a switch on 'letter' precisely so the proven Letter template is never
     disturbed: A 16.5 / C 9.1 / D 4.75 / H 11.25 are measured values and stay
     exactly where they are. */
  letterreg: { wMm: LETTER_W_MM, hMm: LETTER_H_MM, blockWMm: LETTER_W_MM, doubled: false,
               centred: true, regTest: true },
  /* 11 x 17 comes out PORTRAIT — 279.4 x 431.8 — with the two blocks and the
     cut between them turned a quarter turn onto it. The cards keep exactly the
     orientation they have on a Letter sheet relative to the block; it is the
     page that stands up, so the half-sheet cut runs ACROSS the portrait page at
     215.9 from the foot instead of down it. */
  tabloid: { wMm: TABLOID_W_MM, hMm: LETTER_H_MM, blockWMm: LETTER_W_MM, doubled: true, rotated: true },
  a4:      { wMm: A4_W_MM,      hMm: A4_H_MM,     blockWMm: A4_W_MM,     doubled: false },
  /* A3 stands up the same way — 297 x 420. NOTHING FROM THIS TOOL COMES OUT
     LANDSCAPE (owner). */
  a3:      { wMm: A3_W_MM,      hMm: A3_H_MM,     blockWMm: A4_W_MM,     doubled: true, rotated: true },
};

const COLS_N = 2, ROWS_N = 4;

/* ── THE MACHINE'S OWN PROGRAM, read straight off the 2102-F's panel. These are
   not measurements of its output and not preferences — they are the numbers the
   cutter is set to, and the file exists to agree with them:

       Front len    7.6 mm     leading edge to the first cut
       Card len      63 mm     the feed direction
       Card       89 x 63 mm
       Groove len   3.0 mm     the gutter, both axes
       Cut pieces  0010        (see the note below — it should be 8)

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

/** LAYOUT SIZE — the manufacturer's own template, in their words:
 *
 *    "虚线是切卡机的刀的位置，实际排版不需要的。卡片尺寸89X63，排版尺寸是92X66"
 *    "The dashed line is where the card cutter's blade goes — don't include it
 *     in the actual layout. Card size 89x63, LAYOUT SIZE 92x66."
 *
 *  92 x 66 is exactly the card plus the groove (89+3, 63+3), so the art runs
 *  HALF THE GROOVE past the cut on every side and two neighbours meet in the
 *  middle of it. The groove is then solid ink and the blade cuts through
 *  artwork rather than paper — no white sliver whichever way it drifts.
 *
 *  Derived from the groove rather than typed as 1.5, because that is what makes
 *  the two arts meet exactly: change the groove on the machine and this follows.
 *  It moves NO cut line — the cells are still 89 x 63 where the blade goes. */
export const LAYOUT_BLEED_MM = MACHINE_GROOVE_MM / 2;
export const LAYOUT_W_MM = MACHINE_CARD_W_MM + MACHINE_GROOVE_MM;   // 92
export const LAYOUT_L_MM = MACHINE_CARD_L_MM + MACHINE_GROOVE_MM;   // 66

/* ── The template. EVERY GAP IS A SETTING, and these are only the numbers the
   shop measured off its own cut machine. Nothing here is centred, derived from
   a rule, or clever: the operator has a ruler and the machine, and inferring
   this instead of exposing it produced twenty rounds of wrong sheets.

   A and B place the columns; D, E, F and G place the rows. C and H are then what is
   left over — there is one degree of freedom per axis, because A, the cards and
   C have to sum to the sheet. The panel shows C and H live so the operator can
   see what a change did.                                                     */
export const DEF_MARGIN_X_MM = 17.45; // A — sheet edge to the first cut line (the remainder, halved)
export const DEF_MARGIN_TOP_MM = MACHINE_FRONT_MM;  // D — the panel's Front len

export const DEF_GUTTER_X_MM = MACHINE_GROOVE_MM;  // B — the panel's Groove len

/* E, F and G: the three gaps BETWEEN THE ROWS, top to bottom. Each is its own
   setting and each DEFAULTS TO 0 — the rows touch, one cut line serves both
   cards, and the 1.5 mm bleed laps onto the neighbour, which is the same
   artwork. They are separate rather than one shared figure because every crack
   on the sheet has its own letter and its own box: the operator measures three
   gaps with a ruler, not one gap three times, and a machine that drifts down
   the sheet needs them to differ. */
/* ALL THREE ARE THE MACHINE'S GUTTER, AND THEY MUST STAY EQUAL. The cutter is a
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

/* The vertical chain is four cells plus E, F and G:

     D 7.6 + 4(63) + E + F + G + H           on a 279.4 sheet
     at the default 3 3 3                ->  H 10.8

   Nothing is drawn outside a cell, so that sum is the sheet exactly. */

/* ── The black BAR for a slitter's mark mode (the 2102-F has exactly two modes,
   "frontal" and "mark"). One eye at the throat sees paper, then black, and
   indexes every programmed cut off that step. Published figures from the same
   OEM family: Akiles Cardmac Pro wants the mark 3-20 mm in from the leading
   edge with the first cut 5 mm past it; Formax FlashCard uses a 50 x 3 mm bar,
   top-centre, 5 mm above the first cut. These are those numbers, and they are
   settings because this machine's own manual may differ. */
export const REG_MARK_INSET_MM = 3;      // feed edge to the bar
export const REG_MARK_DEPTH_MM = 3;      // bar depth, in the feed direction
/** White pad drawn round the bar, so the eye sees a clean paper-to-black step
 *  even when the background flood is on. */
export const REG_MARK_PAD_MM = 1.5;

/** HEAD MARGIN on the mark stock — 7.5, owner's figure off the machine.
 *
 *  Derived earlier as inset + bar + a 5 mm gap = 11, from the Akiles and Formax
 *  figures for the same OEM family. That was wrong for THIS machine: it pushed
 *  the first cut a long way down the sheet and the bar still crowded the art.
 *  7.5 is what the 2102-F actually wants, and it is exactly what the bar and its
 *  pad occupy: 3 + 3 + 1.5. The pad's trailing edge and the first cut line are
 *  flush, so no paper is wasted and nothing is printed over. */
export const REG_HEAD_MM = 7.5;


/** The cell: the card laid sideways, 1.5 over on both dimensions. Never derived,
 *  never adjusted to make a margin come out — the cell IS the cut size. */
export const PLACED_W_MM = MACHINE_CARD_W_MM;   // 89
export const PLACED_H_MM = MACHINE_CARD_L_MM;   // 63

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
  /** True when the PAGE is a quarter turn from the layout above: every figure
   *  in this fit is in the landscape frame, and the caller stands the finished
   *  page up. pageWMm / pageHMm are what the PDF page actually measures. */
  rotated: boolean;
  pageWMm: number; pageHMm: number;
  /** This stock wants registration marks unless the caller says otherwise. */
  regTest: boolean;
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

  /* On the centred stock the margins FALL OUT of the block rather than being
     read off the machine — but a typed value still wins, so the operator can
     nudge it after a test cut. */
  const mX = t.marginXMm ?? (spec.centred ? (spec.blockWMm - blockW) / 2 : DEF_MARGIN_X_MM);
  /* On the mark stock the HEAD margin is not centred — it has to clear the black
     bar. The sensor needs the bar a few mm in from the feed edge, and the first
     cut has to fall clear of it: REG_MARK_INSET_MM + REG_MARK_DEPTH_MM +
     REG_FIRST_CUT_GAP_MM. Whatever is left goes to the foot. */
  const mTop = t.marginTopMm
    ?? (spec.regTest ? REG_HEAD_MM : spec.centred ? (spec.hMm - blockH) / 2 : DEF_MARGIN_TOP_MM);
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
    rotated: spec.rotated === true,
    regTest: spec.regTest === true,
    pageWMm: spec.rotated ? spec.hMm : spec.wMm,
    pageHMm: spec.rotated ? spec.wMm : spec.hMm,
  };
}
