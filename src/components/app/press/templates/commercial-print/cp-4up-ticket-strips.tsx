import { template, sizedGrid } from '../kit';

export default template({
  id: 'cp-4up-ticket-strips',
  name: "4-Up Ticket Strips",
  desc: 'Event/raffle tickets (8×2.5") stacked 4-up on Letter with perforation marks.',
  category: 'Commercial Print',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'grid', s: { cols: 1, rows: 4, cellWIn: 8, cellHIn: 2.5, sheetWIn: 8.5, sheetHIn: 11, addMarks: true, centerMarks: true } },
  ],
  preview: sizedGrid('cp-4up-ticket-strips', { cols: 1, rows: 4, cellWIn: 8, cellHIn: 2.5, sheetWIn: 8.5, sheetHIn: 11 }, { crop: true, numbered: true }),
});
