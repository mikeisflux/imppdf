/* Door Hangers — gang layout.
 *
 * Door hanger, 3.875 x 8.75". The knob hole is die-cut after trimming.
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

export const DOOR_HANGER_W_IN = 3.875;
export const DOOR_HANGER_H_IN = 8.75;
export const DOOR_HANGER_SHEET_W_IN = 8.5;
export const DOOR_HANGER_SHEET_H_IN = 11;

/** How this piece is actually produced on press — the thing that decides the
 *  gutter, and therefore the count. Die-cut knob hole and rounded top need die clearance. */
export const DOOR_HANGER_DEFAULTS = {
  marginIn: 0.25,
  gutterXIn: 0.125,
  gutterYIn: 0.125,
  buttCut: false,
} as const;

export const DOOR_HANGER_TOOL = 'doorhanger';

export function fitDoorHanger(
  spec: SheetSpec, pieceWIn = DOOR_HANGER_W_IN, pieceHIn = DOOR_HANGER_H_IN,
): SheetFit {
  return packBestOrientation({ ...DOOR_HANGER_DEFAULTS, ...spec }, pieceWIn, pieceHIn, 'door hanger');
}
