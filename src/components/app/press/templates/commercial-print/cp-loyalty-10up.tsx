import { template, grid } from '../kit';

export default template({
  id: 'cp-loyalty-10up',
  name: "Loyalty/Punch Cards (10-Up)",
  desc: 'Standard business-card-size loyalty/punch cards, 10-up on Letter with crop marks.',
  category: 'Commercial Print',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'grid', s: { cols: 2, rows: 5, cellWIn: 3.5, cellHIn: 2, sheetWIn: 8.5, sheetHIn: 11, addMarks: true, centerMarks: true } },
  ],
  preview: grid('cp-loyalty-10up', 2, 5, { crop: true }),
});
