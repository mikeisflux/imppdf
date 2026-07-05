import { template, grid } from '../kit';

export default template({
  id: 'of-recipe-46',
  name: "Recipe Cards (4×6\")",
  desc: 'Standard recipe cards (4×6") printed 4-up on Tabloid. Double-sided for ingredients + instructions.',
  category: 'Office',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'grid', s: { cols: 1, rows: 2, cellWIn: 6, cellHIn: 4, sheetWIn: 8.5, sheetHIn: 11, addMarks: true, centerMarks: true } },
  ],
  preview: grid('of-recipe-46', 1, 2, { crop: true }),
});
