import { template, sizedGrid } from '../kit';

export default template({
  id: 'pk-bakery-liner',
  name: "Bakery Tray Liner (2-Up)",
  desc: 'Bakery/deli tray liners printed 1-up on Tabloid (two 10.5″ liners cannot stack on a 17″ sheet).',
  category: 'Packaging',
  sheetWIn: 11,
  sheetHIn: 17,
  steps: [
    { type: 'grid', s: { cols: 1, rows: 2, cellWIn: 10, cellHIn: 7, sheetWIn: 11, sheetHIn: 17, addMarks: true, centerMarks: true } },
  ],
  preview: sizedGrid('pk-bakery-liner', { cols: 1, rows: 2, cellWIn: 10, cellHIn: 7, sheetWIn: 11, sheetHIn: 17 }, { crop: true }),
});
