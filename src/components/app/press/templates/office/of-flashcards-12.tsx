import { template, sizedGrid } from '../kit';

export default template({
  id: 'of-flashcards-12',
  name: "Flash Cards (12-Up)",
  desc: 'Study flash cards (3.5×2") printed 12-up on Letter. Perfect for students and educators.',
  category: 'Office',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'grid', s: { cols: 3, rows: 4, cellWIn: 2.5, cellHIn: 2.5, sheetWIn: 8.5, sheetHIn: 11, addMarks: true, centerMarks: true } },
  ],
  preview: sizedGrid('of-flashcards-12', { cols: 3, rows: 4, cellWIn: 2.5, cellHIn: 2.5, sheetWIn: 8.5, sheetHIn: 11 }, { crop: true }),
});
