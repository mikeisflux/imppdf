import { template, grid } from '../kit';

export default template({
  id: 'cp-fullbleed-postcards',
  name: "Full-Bleed Postcards (4-Up + Bleed)",
  desc: 'Add 1/8″ bleed to postcard artwork missing bleeds, then gang 4-up on Letter with crop marks.',
  category: 'Commercial Print',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'bleed', s: { bleedIn: 0.125 } },
    { type: 'grid', s: { cols: 2, rows: 2, cellWIn: 4, cellHIn: 5, sheetWIn: 8.5, sheetHIn: 11, bleedMode: 'fixed', bleedIn: 0.125, addMarks: true, centerMarks: true } },
  ],
  preview: grid('cp-fullbleed-postcards', 2, 2, { crop: true }),
});
