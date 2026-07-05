import { template, sizedGrid } from '../kit';

export default template({
  id: 'of-luggage-6',
  name: "Luggage Tags (6-Up)",
  desc: 'Luggage tags (2.5×4.25") printed 6-up on Letter with crop marks for die cutting.',
  category: 'Office',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'grid', s: { cols: 2, rows: 3, cellWIn: 2, cellHIn: 4, sheetWIn: 8.5, sheetHIn: 11, addMarks: true, centerMarks: true } },
  ],
  preview: sizedGrid('of-luggage-6', { cols: 2, rows: 3, cellWIn: 2, cellHIn: 4, sheetWIn: 8.5, sheetHIn: 11 }, { crop: true }),
});
