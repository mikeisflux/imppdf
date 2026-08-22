/* Zfold — 3 panels, folded, ONE piece per sheet.
 *
 * Tabloid landscape, concertina. Panels are EQUAL: a Z-fold folds back on itself so nothing tucks inside anything.
 *
 * A folded piece is not a grid: the panels are divisions of ONE sheet, so the
 * count is 1 and what matters is where the folds land. Treating it as an
 * 3-up grid would cut the piece into 3 separate ones.
 *
 * Asserted in test/fit-folded.test.ts.                                      */

import type { SheetFit, SheetSpec } from './types.ts';
import { packBestOrientation } from './sheet-grid.ts';

export const Z_FOLD_SHEET_W_IN = 17;
export const Z_FOLD_SHEET_H_IN = 11;
export const Z_FOLD_PANELS = 3;
export const Z_FOLD_AXIS = 'vertical' as const;
export const Z_FOLD_TOOL = 'zfold';

export const Z_FOLD_DEFAULTS = {
  marginIn: 0, gutterXIn: 0, gutterYIn: 0,
  addMarks: false, autoRotate: false, buttCut: false,
} as const;

/** Fold positions along the folded axis, in inches from the leading edge.
 *  Returned so a test can check the panels add up to the sheet exactly. */
export function zfoldFolds(sheetLenIn = Z_FOLD_SHEET_W_IN): number[] {
  const n = Z_FOLD_PANELS;
  const at: number[] = [];
  for (let i = 1; i < n; i++) at.push((sheetLenIn * i) / n);
  return at;
}

export function fitZFold(spec: SheetSpec): SheetFit {
  const s = { ...Z_FOLD_DEFAULTS, ...spec };
  const f = packBestOrientation(s, s.sheetWIn, s.sheetHIn, 'zfold piece');
  return { ...f, why: `One piece per sheet, folded into 3 panels. The panels are `
    + `divisions of the sheet, not separate items — ganging them would cut the piece apart.` };
}
