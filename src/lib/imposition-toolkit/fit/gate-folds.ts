/* Gatefold — 4 panels, folded, ONE piece per sheet.
 *
 * Two outer panels meeting in the middle over a double-width centre. The outer panels are each half the centre, less the tuck.
 *
 * A folded piece is not a grid: the panels are divisions of ONE sheet, so the
 * count is 1 and what matters is where the folds land. Treating it as an
 * 4-up grid would cut the piece into 4 separate ones.
 *
 * Asserted in test/fit-folded.test.ts.                                      */

import type { SheetFit, SheetSpec } from './types.ts';
import { packBestOrientation } from './sheet-grid.ts';

export const GATE_FOLD_SHEET_W_IN = 11;
export const GATE_FOLD_SHEET_H_IN = 8.5;
export const GATE_FOLD_PANELS = 4;
export const GATE_FOLD_AXIS = 'vertical' as const;
export const GATE_FOLD_TOOL = 'gatefold';

export const GATE_FOLD_DEFAULTS = {
  marginIn: 0, gutterXIn: 0, gutterYIn: 0,
  addMarks: false, autoRotate: false, buttCut: false,
} as const;

/** Fold positions along the folded axis, in inches from the leading edge.
 *  Returned so a test can check the panels add up to the sheet exactly. */
export function gatefoldFolds(sheetLenIn = GATE_FOLD_SHEET_W_IN): number[] {
  const n = GATE_FOLD_PANELS;
  const at: number[] = [];
  for (let i = 1; i < n; i++) at.push((sheetLenIn * i) / n);
  return at;
}

export function fitGateFold(spec: SheetSpec): SheetFit {
  const s = { ...GATE_FOLD_DEFAULTS, ...spec };
  const f = packBestOrientation(s, s.sheetWIn, s.sheetHIn, 'gatefold piece');
  return { ...f, why: `One piece per sheet, folded into 4 panels. The panels are `
    + `divisions of the sheet, not separate items — ganging them would cut the piece apart.` };
}
