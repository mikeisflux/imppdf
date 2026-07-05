import { template, sizedGrid } from '../kit';

export default template({
  id: 'of-place-cards-8',
  name: "Place Cards (8-Up)",
  desc: 'Event place cards (3.5×2") printed 8-up on Letter. Fold in half for tent-style seating cards.',
  category: 'Office',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'grid', s: { cols: 2, rows: 4, cellWIn: 3.5, cellHIn: 2, sheetWIn: 8.5, sheetHIn: 11, addMarks: true, centerMarks: true } },
  ],
  preview: sizedGrid('of-place-cards-8', { cols: 2, rows: 4, cellWIn: 3.5, cellHIn: 2, sheetWIn: 8.5, sheetHIn: 11 }, { crop: true }),
});
