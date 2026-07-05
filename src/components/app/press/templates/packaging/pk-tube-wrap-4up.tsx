import { template, sizedGrid } from '../kit';

export default template({
  id: 'pk-tube-wrap-4up',
  name: "Tube Label Wrap (4-Up)",
  desc: 'Cosmetic tube label wraps (6×2.5") printed 4-up on a 13×19″ sheet for roll-on application.',
  category: 'Packaging',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'grid', s: { cols: 1, rows: 4, cellWIn: 6, cellHIn: 2, sheetWIn: 8.5, sheetHIn: 11, addMarks: true, centerMarks: true } },
    { type: 'distort' },
  ],
  preview: sizedGrid('pk-tube-wrap-4up', { cols: 1, rows: 4, cellWIn: 6, cellHIn: 2, sheetWIn: 8.5, sheetHIn: 11 }, { crop: true }),
});
