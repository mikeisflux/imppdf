import { template, sizedGrid } from '../kit';

export default template({
  id: 'cp-2up-invitation',
  name: "2-Up Invitation Cards (5×7\")",
  desc: 'Wedding/event invitations (5×7") printed 2-up on Letter with premium bleeds.',
  category: 'Commercial Print',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'grid', s: { cols: 1, rows: 2, cellWIn: 7, cellHIn: 5, sheetWIn: 8.5, sheetHIn: 11, bleedMode: 'fixed', bleedIn: 0.125, addMarks: true, centerMarks: true } },
  ],
  preview: sizedGrid('cp-2up-invitation', { cols: 1, rows: 2, cellWIn: 7, cellHIn: 5, sheetWIn: 8.5, sheetHIn: 11 }, { crop: true }),
});
