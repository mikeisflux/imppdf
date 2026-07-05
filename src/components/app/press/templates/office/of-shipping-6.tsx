import { template, sizedGrid } from '../kit';

export default template({
  id: 'of-shipping-6',
  name: "Shipping Labels (6-Up)",
  desc: 'Shipping/mailing labels (4×3.33") printed 6-up on Letter. Fits standard label sheets.',
  category: 'Office',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'grid', s: { cols: 2, rows: 3, cellWIn: 4, cellHIn: 3, sheetWIn: 8.5, sheetHIn: 11, addMarks: true, centerMarks: true } },
  ],
  preview: sizedGrid('of-shipping-6', { cols: 2, rows: 3, cellWIn: 4, cellHIn: 3, sheetWIn: 8.5, sheetHIn: 11 }, { crop: true }),
});
