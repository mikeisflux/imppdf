import { template, grid } from '../kit';

export default template({
  id: 'pk-candy-wrappers',
  name: "Candy Bar Wrappers (3-Up)",
  desc: 'Candy bar wraps (7.5×5.5") placed 3-up on a 13×19″ press sheet for wrapping and gluing.',
  category: 'Packaging',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'grid', s: { cols: 1, rows: 3, cellWIn: 6, cellHIn: 2.5, sheetWIn: 8.5, sheetHIn: 11, addMarks: true, centerMarks: true } },
  ],
  preview: grid('pk-candy-wrappers', 1, 3, { crop: true }),
});
