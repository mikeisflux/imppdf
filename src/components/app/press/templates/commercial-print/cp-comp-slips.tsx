import { template, sizedGrid } from '../kit';

export default template({
  id: 'cp-comp-slips',
  name: "Compliment Slips (DL 3-Up)",
  desc: 'DL compliment slips (8.27×3.9") ganged 3-up on an SRA4 sheet.',
  category: 'Commercial Print',
  sheetWIn: 8.86,
  sheetHIn: 12.6,
  steps: [
    { type: 'grid', s: { cols: 1, rows: 3, cellWIn: 8.27, cellHIn: 3.9, sheetWIn: 8.86, sheetHIn: 12.6, addMarks: true, centerMarks: true } },
  ],
  preview: sizedGrid('cp-comp-slips', { cols: 1, rows: 3, cellWIn: 8.27, cellHIn: 3.9, sheetWIn: 8.86, sheetHIn: 12.6 }, { crop: true }),
});
