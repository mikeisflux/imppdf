import { template, signature } from '../kit';

// Trade Paperback (A5) — perfect-bound A5 (5.8×8.3") graphic novel / paperback,
// imposed 2-up on 11×17 with collating and trim marks.
export default template({
  id: 'pb-trade-a5',
  name: 'Trade Paperback (A5)',
  desc: 'Perfect-bound A5 (5.8×8.3") graphic novel / trade paperback, imposed 2-up on 11×17.',
  category: 'Publishing',
  sheetWIn: 11.6,
  sheetHIn: 16.6,
  steps: [
    { type: 'booklet', s: { signatureSheets: 4, sheetWIn: 17, sheetHIn: 11 } },
    { type: 'collating' },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: signature('pb-trade-a5', { cols: 2, rows: 2, saddle: false, crop: true, reg: true, cut: true }),
});
