import { template, sizedGrid } from '../kit';

export default template({
  id: 'of-emergency-10',
  name: "Emergency Contact Cards (10-Up)",
  desc: 'Wallet-size emergency contact cards (3.5×2") printed 10-up on Letter.',
  category: 'Office',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'grid', s: { cols: 2, rows: 5, cellWIn: 3.5, cellHIn: 2, sheetWIn: 8.5, sheetHIn: 11, addMarks: true, centerMarks: true } },
  ],
  preview: sizedGrid('of-emergency-10', { cols: 2, rows: 5, cellWIn: 3.5, cellHIn: 2, sheetWIn: 8.5, sheetHIn: 11 }, { crop: true }),
});
