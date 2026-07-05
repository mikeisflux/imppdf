import { template, signature } from '../kit';

// Trade Paperback (Standard) — perfect-bound 6.625×10.25" graphic novel,
// imposed 2-up on 11×17 with collating and trim marks.
export default template({
  id: 'pb-trade-standard',
  name: 'Trade Paperback (Standard)',
  desc: 'Perfect-bound Standard (6.625×10.25") graphic novel / trade paperback, imposed 2-up on 11×17.',
  category: 'Publishing',
  sheetWIn: 13.25,
  sheetHIn: 20.5,
  steps: [
    { type: 'booklet', s: { signatureSheets: 4, sheetWIn: 17, sheetHIn: 11 } },
    { type: 'collating' },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: signature('pb-trade-standard', { cols: 2, rows: 2, saddle: false, crop: true, reg: true, cut: true }),
});
