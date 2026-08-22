/* Per-tool fit calculators.

   WHY THESE EXIST AS SEPARATE FILES. There used to be one shared grid function
   that every tool called with slightly different arguments, and its behaviour
   was tuned whenever one tool looked wrong. Tuning it for one tool silently
   changed the others — an index card sheet quietly dropped from ten cards to
   four because a mark allowance had been widened for a different tool, and
   nothing failed to say so.

   So: one file per tool, each stating that tool's own rules in full, each with
   its own test asserting the counts that tool is supposed to produce. Shared
   arithmetic lives in sheet-grid.ts and knows nothing about any tool. When a
   tool's numbers are wrong, exactly one file changes and exactly one test moves.

   Every calculator returns the SAME shape, and every one of them explains
   itself in `why` — the panel shows that text, so the operator can see which
   constraint decided the count instead of guessing.                         */

export interface SheetFit {
  cols: number;
  rows: number;
  /** cols × rows — how many pieces land on one sheet. */
  n: number;
  /** Margins and gutters actually used, after mark clearance is applied. */
  marginIn: number;
  gutterXIn: number;
  gutterYIn: number;
  /** Cell the art is placed into, after any rotation. */
  cellWIn: number;
  cellHIn: number;
  /** True when the piece was turned 90° because that fits more per sheet. */
  rotated: boolean;
  /** False when even one piece cannot fit the sheet at this size. */
  fits: boolean;
  /** Plain-language account of what limited the count. Shown in the panel. */
  why: string;
}

export interface SheetSpec {
  sheetWIn: number;
  sheetHIn: number;
  marginIn?: number;
  gutterXIn?: number;
  gutterYIn?: number;
  /** Cut marks: offset from the trim, and how long the mark is drawn. */
  addMarks?: boolean;
  markOffIn?: number;
  markLenIn?: number;
  /** Bleed carried on every side of the piece, if the art has it. */
  bleedIn?: number;
  /** Allow turning the piece 90° when that fits more. */
  autoRotate?: boolean;
}
