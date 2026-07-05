import { template, sizedGrid } from '../kit';

export default template({
  id: 'pk-cereal-box',
  name: "Cereal Box Flat",
  desc: 'Folding cereal-carton flat (8×14") with cut contour on the die.',
  category: 'Packaging',
  sheetWIn: 11,
  sheetHIn: 17,
  steps: [
    { type: 'grid', s: { cols: 1, rows: 1, cellWIn: 8, cellHIn: 14, sheetWIn: 11, sheetHIn: 17, addMarks: true, centerMarks: true } },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: sizedGrid('pk-cereal-box', { cols: 1, rows: 1, cellWIn: 8, cellHIn: 14, sheetWIn: 11, sheetHIn: 17 }, { crop: true, reg: true, cut: true }),
});
