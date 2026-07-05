import { template, bookSheet } from '../kit';

// Trade Paperback (Standard) — perfect-bound 6.625×10.25" graphic novel,
// imposed 2-up on 11×17 with collating and trim marks.
export default template({
  id: 'pb-trade-standard',
  name: 'Trade Paperback (Standard)',
  desc: 'Perfect-bound Standard (6.625×10.25") graphic novel / trade paperback — 2-up on 11×17 in sequential (cut-and-stack) order, page 2 backing page 1.',
  category: 'Publishing',
  sheetWIn: 17,
  sheetHIn: 11,
  steps: [
    { type: 'perfectbound', s: { cols: 2, rows: 1, cellWIn: 6.625, cellHIn: 10.25, duplex: true, cutStack: true, marginIn: 0, gutterIn: 0, sheetWIn: 17, sheetHIn: 11, addMarks: true, centerMarks: true } },
    { type: 'collating' },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: bookSheet('pb-trade-standard', { trimWIn: 6.625, trimHIn: 10.25, sheetWIn: 17, sheetHIn: 11 }, { saddle: false, crop: true, reg: true, cut: true }),
});
