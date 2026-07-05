import { template, sizedGrid } from '../kit';

export default template({
  id: 'of-2up-proof-tab',
  name: "2-Up Proofing on Tabloid",
  desc: 'Proof Letter-size artwork 2-up on Tabloid with crop marks to verify bleed and trim.',
  category: 'Office',
  sheetWIn: 11,
  sheetHIn: 17,
  steps: [
    { type: 'grid', s: { cols: 1, rows: 2, cellWIn: 11, cellHIn: 8.5, sheetWIn: 11, sheetHIn: 17, addMarks: true, centerMarks: true } },
    { type: 'watermark', s: { text: 'PROOF' } },
  ],
  preview: sizedGrid('of-2up-proof-tab', { cols: 1, rows: 2, cellWIn: 11, cellHIn: 8.5, sheetWIn: 11, sheetHIn: 17 }, { crop: true, watermark: 'PROOF' }),
});
