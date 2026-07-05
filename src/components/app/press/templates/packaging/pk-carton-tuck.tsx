import { template, sizedGrid } from '../kit';

export default template({
  id: 'pk-carton-tuck',
  name: "Folding Carton — Straight Tuck End",
  desc: 'Straight-tuck-end folding carton flat (7×9") with cut contour.',
  category: 'Packaging',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'grid', s: { cols: 1, rows: 1, cellWIn: 7, cellHIn: 9, sheetWIn: 8.5, sheetHIn: 11, addMarks: true, centerMarks: true } },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: sizedGrid('pk-carton-tuck', { cols: 1, rows: 1, cellWIn: 7, cellHIn: 9, sheetWIn: 8.5, sheetHIn: 11 }, { crop: true, reg: true, cut: true }),
});
