import { template, bookSheet } from '../kit';

// Trade Paperback (A5) — perfect-bound A5 (5.8×8.3") graphic novel / paperback,
// imposed 2-up on 11×17 with collating and trim marks.
export default template({
  id: 'pb-trade-a5',
  name: 'Trade Paperback (A5)',
  desc: 'Perfect-bound A5 (5.8×8.3") graphic novel / trade paperback, imposed 2-up on 11×17.',
  category: 'Publishing',
  sheetWIn: 17,
  sheetHIn: 11,
  steps: [
    { type: 'booklet', s: { signatureSheets: 4, sheetWIn: 17, sheetHIn: 11 } },
    { type: 'collating' },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: bookSheet('pb-trade-a5', { trimWIn: 5.8, trimHIn: 8.3, sheetWIn: 17, sheetHIn: 11 }, { saddle: false, crop: true, reg: true, cut: true }),
});
