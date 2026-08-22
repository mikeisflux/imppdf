/* Yard Signs — large format, ONE piece per sheet.
 *
 * Wide-format work is printed to the piece, not ganged on a press sheet: the
 * media IS the yard sign. So there is no grid to compute and NO CUT MARKS —
 * marks would print on the finished piece, and there is no margin to hide
 * them in. The count is 1 by the nature of the job, not by arithmetic.
 *
 * Rotation is off: a yard sign has a fixed orientation. Turning it to "fit
 * better" would deliver the artwork on its side.
 *
 * Asserted in test/fit-large-format.test.ts.                                */

import type { SheetFit, SheetSpec } from './types.ts';
import { packBestOrientation } from './sheet-grid.ts';

export const YARD_SIGN_W_IN = 24;
export const YARD_SIGN_H_IN = 18;
export const YARD_SIGN_TOOL = 'yardsign';

/** Large format never gangs and never marks. */
export const YARD_SIGN_DEFAULTS = {
  marginIn: 0, gutterXIn: 0, gutterYIn: 0,
  addMarks: false, autoRotate: false, buttCut: false,
} as const;

export function fitYardSign(
  spec: SheetSpec, pieceWIn = YARD_SIGN_W_IN, pieceHIn = YARD_SIGN_H_IN,
): SheetFit {
  const f = packBestOrientation({ ...YARD_SIGN_DEFAULTS, ...spec }, pieceWIn, pieceHIn, 'piece');
  /* FORCED to one. The grid above only answers "would more fit"; for wide
     format the answer is irrelevant — the media IS the piece, so a bigger sheet
     means a bigger print, never two prints. Letting the grid decide put four
     yard signs on a 48 x 36" sheet, which is four signs nobody ordered. */
  return {
    ...f, cols: 1, rows: 1, n: 1, cellWIn: pieceWIn, cellHIn: pieceHIn, rotated: false,
    why: f.fits
      ? 'One piece per sheet — wide-format work prints to the piece, so it is never '
        + 'ganged and carries no cut marks. A bigger sheet means a bigger print.'
      : f.why,
  };
}
