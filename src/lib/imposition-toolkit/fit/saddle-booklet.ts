/* Saddle-stitched booklets — booklet, comic, magazine, catalog, program,
 * notebook, hymnal. One scheme, one file: they differ only in trim and sheet.
 *
 * A saddle booklet is TWO pages per side of a sheet, folded down the middle and
 * stapled through the spine. Its arithmetic is nothing like a gang sheet:
 *
 *   - Pages come in FOURS. Two pages per side, two sides per sheet. A 6-page
 *     document needs 8 page slots; the two spare are blank, not dropped.
 *   - Page order is the fold, not the sequence: sheet 1 carries the last page
 *     beside the first. Get this wrong and the book reads as nonsense while
 *     every count looks right.
 *   - CREEP: the inner pages stick out further than the outer ones, by half
 *     the folded thickness. The trim shaves that off, so inner pages must be
 *     shifted toward the spine or the inner margins walk.
 *
 * Asserted in test/fit-bound.test.ts.                                       */

import type { SheetFit, SheetSpec } from './types.ts';

export const SADDLE_UP_PER_SIDE = 2;
export const SADDLE_PAGE_MULTIPLE = 4;

/** Page slots needed: always a multiple of four, never fewer than the document. */
export function saddlePageSlots(pageCount: number): number {
  const n = Math.max(1, Math.ceil(pageCount));
  return Math.ceil(n / SADDLE_PAGE_MULTIPLE) * SADDLE_PAGE_MULTIPLE;
}

/** Sheets in the booklet — four page slots each (two per side, two sides). */
export function saddleSheets(pageCount: number): number {
  return saddlePageSlots(pageCount) / SADDLE_PAGE_MULTIPLE;
}

/** Reading order for one sheet: [frontLeft, frontRight, backLeft, backRight],
 *  1-based page numbers into the padded slot list. Sheet 0 is the outermost. */
export function saddleSheetPages(sheetIdx: number, pageCount: number): [number, number, number, number] {
  const slots = saddlePageSlots(pageCount);
  const last = slots - sheetIdx * 2;
  const first = sheetIdx * 2 + 1;
  // Outer side carries the last page beside the first; inner side the two middles.
  return [last, first, first + 1, last - 1];
}

/** Creep for a given sheet: how far its pages must move toward the spine.
 *  Outermost sheet does not move; each sheet inside it moves by the caliper. */
export function saddleCreepIn(sheetIdx: number, totalSheets: number, creepPerSheetIn: number): number {
  const fromOutside = Math.max(0, Math.min(sheetIdx, totalSheets - 1));
  return fromOutside * creepPerSheetIn;
}

export function fitSaddleBooklet(spec: SheetSpec, pageCount: number): SheetFit {
  const sheets = saddleSheets(pageCount);
  const slots = saddlePageSlots(pageCount);
  const blank = slots - Math.ceil(pageCount);
  const cellWIn = spec.sheetWIn / 2;
  return {
    cols: 2, rows: 1, n: 2,
    marginIn: spec.marginIn ?? 0, gutterXIn: 0, gutterYIn: 0,
    cellWIn, cellHIn: spec.sheetHIn, rotated: false, fits: true, buttCut: false,
    why: `2 pages per side, folded down the middle. ${pageCount} pages pad to ${slots} slots `
      + `(${blank} blank) across ${sheets} sheet${sheets === 1 ? '' : 's'} — saddle work comes in fours.`,
  };
}
