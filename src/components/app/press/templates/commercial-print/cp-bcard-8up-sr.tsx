import { template, grid } from '../kit';

export default template({
  id: 'cp-bcard-8up-sr',
  name: "Business Card 8-Up (Step & Repeat)",
  desc: '8-up step-and-repeat business cards (3.5×2") — every slot prints the same card.',
  category: 'Commercial Print',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'grid', s: { cols: 2, rows: 4, cellWIn: 3.5, cellHIn: 2, order: 'repeat', sheetWIn: 8.5, sheetHIn: 11, addMarks: true, centerMarks: true } },
  ],
  preview: grid('cp-bcard-8up-sr', 2, 4, { crop: true }),
});
