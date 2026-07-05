import { template, bookSheet } from '../kit';

// Trade Paperback (Letter) — perfect-bound 8.5×11" graphic novel, imposed
// 2-up on 11×17 with collating and trim marks.
export default template({
  id: 'pb-trade-letter',
  name: 'Trade Paperback (Letter)',
  desc: 'Perfect-bound Letter (8.5×11") graphic novel / trade paperback — 2-up on 11×17 in sequential (cut-and-stack) order, page 2 backing page 1.',
  category: 'Publishing',
  sheetWIn: 17,
  sheetHIn: 11,
  steps: [
    { type: 'perfectbound', s: { cols: 2, rows: 1, cellWIn: 8.5, cellHIn: 11, duplex: true, cutStack: true, marginIn: 0, gutterIn: 0, sheetWIn: 17, sheetHIn: 11, addMarks: true, centerMarks: true } },
    { type: 'collating' },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: bookSheet('pb-trade-letter', { trimWIn: 8.5, trimHIn: 11, sheetWIn: 17, sheetHIn: 11 }, { saddle: false, crop: true, reg: true, cut: true }),
});
