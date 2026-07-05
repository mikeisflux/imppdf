import { template, grid } from '../kit';

export default template({
  id: 'of-fullbleed-photocards',
  name: "Full-Bleed Photo Cards (4×6\")",
  desc: 'Add bleed to 4×6" photo cards, then gang them 2-up (landscape) on Letter.',
  category: 'Office',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'bleed', s: { bleedIn: 0.125 } },
    { type: 'grid', s: { cols: 1, rows: 2, cellWIn: 6, cellHIn: 4, sheetWIn: 8.5, sheetHIn: 11, bleedMode: 'fixed', bleedIn: 0.125, addMarks: true, centerMarks: true } },
  ],
  preview: grid('of-fullbleed-photocards', 1, 2, { crop: true }),
});
