/* Art prints — comic 6.88 × 10.5" and 11 × 17", on a 12 × 18" sheet.
 *
 * These sizes ALREADY INCLUDE the 0.125" bleed on every side (owner spec), so
 * the piece placed on the sheet is the full bleed size and the cut marks sit
 * 0.125" INSIDE it, at the trim. That is the opposite of every other tool
 * here, where the piece is the trim size — which is exactly the kind of
 * tool-specific rule that has no business living in a shared function.
 *
 * Expected: comic 2-up on 12 × 18; 11 × 17 is 1-up.
 * Asserted in test/fit-art-prints.test.ts.                                  */

import type { SheetFit, SheetSpec } from './types.ts';
import { packBestOrientation } from './sheet-grid.ts';

/** Both sizes as supplied — bleed included. */
export const ART_PRINT_SIZES = {
  comic: { wIn: 6.88, hIn: 10.5, label: 'comic print' },
  eleven17: { wIn: 11.25, hIn: 17.25, label: '11×17 print' },
} as const;

export const ART_PRINT_BLEED_IN = 0.125;

export function fitArtPrints(spec: SheetSpec, pieceWIn: number, pieceHIn: number): SheetFit {
  const label = pieceWIn <= 8 ? ART_PRINT_SIZES.comic.label : ART_PRINT_SIZES.eleven17.label;
  const fit = packBestOrientation(spec, pieceWIn, pieceHIn, label);
  return {
    ...fit,
    why: `${fit.why} The size includes ${ART_PRINT_BLEED_IN}" bleed on every side, `
      + 'so the cut marks sit inside the piece, at the trim.',
  };
}
