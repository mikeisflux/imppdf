import { template, sizedGrid } from '../kit';

export default template({
  id: 'pk-retail-box-2up',
  name: "Retail Box Flat 2-Up",
  desc: 'Retail box flats (9×7") 2-up positioned on the die with cut contour.',
  category: 'Packaging',
  sheetWIn: 11,
  sheetHIn: 17,
  steps: [
    { type: 'grid', s: { cols: 1, rows: 2, cellWIn: 9, cellHIn: 7, sheetWIn: 11, sheetHIn: 17, addMarks: true, centerMarks: true } },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: sizedGrid('pk-retail-box-2up', { cols: 1, rows: 2, cellWIn: 9, cellHIn: 7, sheetWIn: 11, sheetHIn: 17 }, { crop: true, reg: true, cut: true }),
});
