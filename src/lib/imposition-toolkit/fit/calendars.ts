/* Calendars — a half-sheet spread with the back rotated 180 degrees.
 *
 * A wall calendar hangs from the fold: the picture is the top half, the grid
 * the bottom. Print two half-sheets per sheet and the BACK must be turned 180
 * degrees, or every other month prints upside down once the pad is bound.
 *
 * Asserted in test/fit-bound.test.ts.                                       */

import type { SheetFit, SheetSpec } from './types.ts';

export const CALENDAR_DEFAULTS = { rotateBack: true, halfSheet: false } as const;

export function fitCalendar(spec: SheetSpec, halfSheet = false): SheetFit {
  const rows = halfSheet ? 2 : 1;
  return {
    cols: 1, rows, n: rows,
    marginIn: spec.marginIn ?? 0, gutterXIn: 0, gutterYIn: 0,
    cellWIn: spec.sheetWIn, cellHIn: spec.sheetHIn / rows,
    rotated: false, fits: true, buttCut: false,
    why: halfSheet
      ? 'Two half-sheets per sheet; the back is turned 180° so the bound pad reads the right way up.'
      : 'One month per sheet.',
  };
}
