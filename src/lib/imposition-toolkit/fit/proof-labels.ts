/* 30-Up Proof Labels — a die-cut label sheet, 3 across × 10 down on Letter.
 *
 * This tool does NOT compute its grid from the art. The die is fixed: the
 * positions are the die-cutter's, so the layout is 3 × 10 whatever is dropped
 * on it, and the art is STRETCHED into the label cell rather than fitted
 * proportionally inside it (owner spec — the die-cut cell IS the target size).
 * Uploads are trimmed to their artwork first, because label art is exported
 * from a template at full sheet size.
 *
 * A fit calculator that "worked out" a grid here would be wrong even when its
 * arithmetic was right, which is why this file states the die instead.
 * Asserted in test/fit-proof-labels.test.ts.                                */

import type { SheetFit, SheetSpec } from './types.ts';

export const PROOF_LABEL_COLS = 3;
export const PROOF_LABEL_ROWS = 10;

export function fitProofLabels(spec: SheetSpec, cellWIn: number, cellHIn: number): SheetFit {
  const marginIn = spec.marginIn ?? 0;
  const gutterXIn = spec.gutterXIn ?? 0;
  const gutterYIn = spec.gutterYIn ?? 0;
  const needW = PROOF_LABEL_COLS * cellWIn + (PROOF_LABEL_COLS - 1) * gutterXIn + 2 * marginIn;
  const needH = PROOF_LABEL_ROWS * cellHIn + (PROOF_LABEL_ROWS - 1) * gutterYIn + 2 * marginIn;
  const fits = needW <= spec.sheetWIn + 1e-6 && needH <= spec.sheetHIn + 1e-6;
  return {
    cols: PROOF_LABEL_COLS, rows: PROOF_LABEL_ROWS, n: PROOF_LABEL_COLS * PROOF_LABEL_ROWS,
    marginIn, gutterXIn, gutterYIn, cellWIn, cellHIn, rotated: false, fits,
    why: `Fixed ${PROOF_LABEL_COLS}×${PROOF_LABEL_ROWS} die — the label positions are the `
      + 'die-cutter\'s, not something to calculate. Art is stretched to fill each label cell.'
      + (fits ? '' : ' The die does not fit the selected sheet.'),
  };
}
