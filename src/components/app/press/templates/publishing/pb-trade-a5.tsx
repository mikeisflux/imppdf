import { template, bookSheet } from '../kit';

// Trade Paperback (A5) — perfect-bound A5 (5.8×8.3") graphic novel / paperback,
// imposed 2-up on 11×17 with collating and trim marks.
export default template({
  id: 'pb-trade-a5',
  name: 'Trade Paperback (A5)',
  desc: 'Perfect-bound A5 (5.8×8.3") graphic novel / trade paperback — 2-up on 11×17 in sequential (cut-and-stack) order, page 2 backing page 1.',
  category: 'Publishing',
  sheetWIn: 17,
  sheetHIn: 11,
  steps: [
    { type: 'perfectbound', s: { cols: 2, rows: 1, cellWIn: 5.8, cellHIn: 8.3, duplex: true, cutStack: true, marginIn: 0, gutterIn: 0, sheetWIn: 17, sheetHIn: 11, addMarks: true, centerMarks: true } },
    { type: 'collating' },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: bookSheet('pb-trade-a5', { trimWIn: 5.8, trimHIn: 8.3, sheetWIn: 17, sheetHIn: 11 }, { saddle: false, crop: true, reg: true, cut: true }),
});
