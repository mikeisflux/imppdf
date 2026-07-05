import { template, sizedGrid } from '../kit';

export default template({
  id: 'cp-proof-sheet-wm',
  name: "Proof Sheet with PROOF Watermark",
  desc: '2-up proofing layout (11×8.5") on Tabloid with a diagonal PROOF watermark.',
  category: 'Commercial Print',
  sheetWIn: 11,
  sheetHIn: 17,
  steps: [
    { type: 'grid', s: { cols: 1, rows: 2, cellWIn: 11, cellHIn: 8.5, sheetWIn: 11, sheetHIn: 17, addMarks: true, centerMarks: true } },
    { type: 'watermark', s: { text: 'PROOF' } },
  ],
  preview: sizedGrid('cp-proof-sheet-wm', { cols: 1, rows: 2, cellWIn: 11, cellHIn: 8.5, sheetWIn: 11, sheetHIn: 17 }, { crop: true, watermark: 'PROOF' }),
});
