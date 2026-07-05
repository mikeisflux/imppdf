import { template, sizedGrid } from '../kit';

export default template({
  id: 'of-tent-cards-4',
  name: "Tent Cards (4-Up)",
  desc: 'Table tent cards (5×5" flat, folds to 5×2.5") printed 4-up on Letter.',
  category: 'Office',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'grid', s: { cols: 2, rows: 2, cellWIn: 4, cellHIn: 3.5, sheetWIn: 8.5, sheetHIn: 11, addMarks: true, centerMarks: true } },
  ],
  preview: sizedGrid('of-tent-cards-4', { cols: 2, rows: 2, cellWIn: 4, cellHIn: 3.5, sheetWIn: 8.5, sheetHIn: 11 }, { crop: true }),
});
