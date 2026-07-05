import { template, sizedGrid } from '../kit';

export default template({
  id: 'pk-bottlecap-labels',
  name: "Bottle Cap Labels (Nested)",
  desc: 'Small round bottle-cap labels (1.2") nested with kiss-cut contour.',
  category: 'Packaging',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'stickers', s: { cols: 5, rows: 7, cellWIn: 1.2, cellHIn: 1.2, sheetWIn: 8.5, sheetHIn: 11, addMarks: true, centerMarks: true } },
  ],
  preview: sizedGrid('pk-bottlecap-labels', { cols: 5, rows: 7, cellWIn: 1.2, cellHIn: 1.2, sheetWIn: 8.5, sheetHIn: 11 }, { crop: true }),
});
