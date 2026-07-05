import { template, signature } from '../kit';

// Trade Paperback (Letter) — perfect-bound 8.5×11" graphic novel, imposed
// 2-up on 11×17 with collating and trim marks.
export default template({
  id: 'pb-trade-letter',
  name: 'Trade Paperback (Letter)',
  desc: 'Perfect-bound Letter (8.5×11") graphic novel / trade paperback, imposed 2-up on 11×17.',
  category: 'Publishing',
  sheetWIn: 17,
  sheetHIn: 22,
  steps: [
    { type: 'booklet', s: { signatureSheets: 4, sheetWIn: 17, sheetHIn: 11 } },
    { type: 'collating' },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: signature('pb-trade-letter', { cols: 2, rows: 2, saddle: false, crop: true, reg: true, cut: true }),
});
