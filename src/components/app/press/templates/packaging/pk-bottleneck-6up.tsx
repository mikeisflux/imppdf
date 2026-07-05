import { template, sizedGrid } from '../kit';

export default template({
  id: 'pk-bottleneck-6up',
  name: "Bottle Neck Hangers (6-Up)",
  desc: 'Die-cut bottle-neck hangers (3×4") 6-up with cut contour.',
  category: 'Packaging',
  sheetWIn: 11,
  sheetHIn: 17,
  steps: [
    { type: 'grid', s: { cols: 2, rows: 3, cellWIn: 3, cellHIn: 4, sheetWIn: 11, sheetHIn: 17, addMarks: true, centerMarks: true } },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: sizedGrid('pk-bottleneck-6up', { cols: 2, rows: 3, cellWIn: 3, cellHIn: 4, sheetWIn: 11, sheetHIn: 17 }, { crop: true, reg: true, cut: true }),
});
