import { template, sizedGrid } from '../kit';

export default template({
  id: 'pk-soap-bands',
  name: "Soap Band Wraps (8-Up)",
  desc: 'Soap belly-band wraps (7×1.2") ganged 8-up on Letter.',
  category: 'Packaging',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'grid', s: { cols: 1, rows: 8, cellWIn: 7, cellHIn: 1.2, sheetWIn: 8.5, sheetHIn: 11, addMarks: true, centerMarks: true } },
  ],
  preview: sizedGrid('pk-soap-bands', { cols: 1, rows: 8, cellWIn: 7, cellHIn: 1.2, sheetWIn: 8.5, sheetHIn: 11 }, { crop: true }),
});
