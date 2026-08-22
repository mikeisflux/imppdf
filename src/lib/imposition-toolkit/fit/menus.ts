/* Menu — 2 panels, folded, ONE piece per sheet.
 *
 * Tabloid landscape folded once down the middle.
 *
 * A folded piece is not a grid: the panels are divisions of ONE sheet, so the
 * count is 1 and what matters is where the folds land. Treating it as an
 * 2-up grid would cut the piece into 2 separate ones.
 *
 * Asserted in test/fit-folded.test.ts.                                      */

import type { SheetFit, SheetSpec } from './types.ts';
import { packBestOrientation } from './sheet-grid.ts';

export const MENU_SHEET_W_IN = 17;
export const MENU_SHEET_H_IN = 11;
export const MENU_PANELS = 2;
export const MENU_AXIS = 'vertical' as const;
export const MENU_TOOL = 'menu';

export const MENU_DEFAULTS = {
  marginIn: 0, gutterXIn: 0, gutterYIn: 0,
  addMarks: false, autoRotate: false, buttCut: false,
} as const;

/** Fold positions along the folded axis, in inches from the leading edge.
 *  Returned so a test can check the panels add up to the sheet exactly. */
export function menuFolds(sheetLenIn = MENU_SHEET_W_IN): number[] {
  const n = MENU_PANELS;
  const at: number[] = [];
  for (let i = 1; i < n; i++) at.push((sheetLenIn * i) / n);
  return at;
}

export function fitMenu(spec: SheetSpec): SheetFit {
  const s = { ...MENU_DEFAULTS, ...spec };
  const f = packBestOrientation(s, s.sheetWIn, s.sheetHIn, 'menu piece');
  return { ...f, why: `One piece per sheet, folded into 2 panels. The panels are `
    + `divisions of the sheet, not separate items — ganging them would cut the piece apart.` };
}
