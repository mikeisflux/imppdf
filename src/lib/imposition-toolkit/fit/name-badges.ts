/* Name Badges — gang layout.
 *
 * Name badge insert, 3.5 x 2.25" — sized for a standard clip holder.
 *
 * The piece placed on the sheet is the TRIM size: cut marks sit outside it.
 * (Art Prints is the exception in this directory — its sizes include bleed.)
 *
 * Counts for the common sheets are asserted in test/fit-all-tools.test.ts,
 * which also checks that every placed cell lands inside the margins and that
 * no two overlap. If a change to the shared grid moves this tool's numbers,
 * that test fails naming this tool.                                        */

import type { SheetFit, SheetSpec } from './types.ts';
import { packBestOrientation } from './sheet-grid.ts';

export const NAME_BADGE_W_IN = 3.5;
export const NAME_BADGE_H_IN = 2.25;
export const NAME_BADGE_SHEET_W_IN = 8.5;
export const NAME_BADGE_SHEET_H_IN = 11;

/** How this piece is actually produced on press — the thing that decides the
 *  gutter, and therefore the count. Butt-cut inserts. */
export const NAME_BADGE_DEFAULTS = {
  marginIn: 0.25,
  gutterXIn: 0,
  gutterYIn: 0,
  buttCut: true,
} as const;

export const NAME_BADGE_TOOL = 'namebadge';

export function fitNameBadge(
  spec: SheetSpec, pieceWIn = NAME_BADGE_W_IN, pieceHIn = NAME_BADGE_H_IN,
): SheetFit {
  return packBestOrientation({ ...NAME_BADGE_DEFAULTS, ...spec }, pieceWIn, pieceHIn, 'name badge');
}
