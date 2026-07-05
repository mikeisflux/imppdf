import { template, sizedGrid } from '../kit';

export default template({
  id: 'cp-rsvp-4up',
  name: "RSVP Cards (4-Up A7)",
  desc: 'Response/RSVP cards (3.5×5") printed 4-up on Letter with crop marks.',
  category: 'Commercial Print',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'grid', s: { cols: 2, rows: 2, cellWIn: 3.5, cellHIn: 5, sheetWIn: 8.5, sheetHIn: 11, addMarks: true, centerMarks: true } },
  ],
  preview: sizedGrid('cp-rsvp-4up', { cols: 2, rows: 2, cellWIn: 3.5, cellHIn: 5, sheetWIn: 8.5, sheetHIn: 11 }, { crop: true }),
});
