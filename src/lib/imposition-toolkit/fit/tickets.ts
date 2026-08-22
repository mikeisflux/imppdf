/* Tickets — gang layout.
 *
 * Event ticket, 4 x 2.5". Often numbered; the serial stamp does not change the
 * fit, it prints inside the cell.
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

export const TICKET_W_IN = 4;
export const TICKET_H_IN = 2.5;
export const TICKET_SHEET_W_IN = 8.5;
export const TICKET_SHEET_H_IN = 11;

/** How this piece is actually produced on press — the thing that decides the
 *  gutter, and therefore the count. Butt-cut, then numbered and perforated. */
export const TICKET_DEFAULTS = {
  marginIn: 0.25,
  gutterXIn: 0,
  gutterYIn: 0,
  buttCut: true,
} as const;

export const TICKET_TOOL = 'ticket';

export function fitTicket(
  spec: SheetSpec, pieceWIn = TICKET_W_IN, pieceHIn = TICKET_H_IN,
): SheetFit {
  return packBestOrientation({ ...TICKET_DEFAULTS, ...spec }, pieceWIn, pieceHIn, 'ticket');
}
