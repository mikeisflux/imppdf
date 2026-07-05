import { template, bookSheet } from '../kit';

// Trade Paperback (Magazine) — perfect-bound 8×10.5" graphic novel, imposed
// 2-up on 11×17 with collating and trim marks.
export default template({
  id: 'pb-trade-magazine',
  name: 'Trade Paperback (Magazine)',
  desc: 'Perfect-bound Magazine (8×10.5") graphic novel / trade paperback, imposed 2-up on 11×17.',
  category: 'Publishing',
  sheetWIn: 17,
  sheetHIn: 11,
  steps: [
    { type: 'booklet', s: { signatureSheets: 4, sheetWIn: 17, sheetHIn: 11 } },
    { type: 'collating' },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: bookSheet('pb-trade-magazine', { trimWIn: 8, trimHIn: 10.5, sheetWIn: 17, sheetHIn: 11 }, { saddle: false, crop: true, reg: true, cut: true }),
});
