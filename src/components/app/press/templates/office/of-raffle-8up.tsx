import { template, sizedGrid } from '../kit';

export default template({
  id: 'of-raffle-8up',
  name: "Raffle Tickets (8-Up)",
  desc: 'Numbered raffle tickets (2×5.5") printed 8-up on Letter with perforation marks.',
  category: 'Office',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'grid', s: { cols: 2, rows: 4, cellWIn: 4, cellHIn: 2.5, sheetWIn: 8.5, sheetHIn: 11, addMarks: true, centerMarks: true } },
  ],
  preview: sizedGrid('of-raffle-8up', { cols: 2, rows: 4, cellWIn: 4, cellHIn: 2.5, sheetWIn: 8.5, sheetHIn: 11 }, { crop: true }),
});
