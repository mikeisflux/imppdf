import { template, sizedGrid } from '../kit';

export default template({
  id: 'cp-round-coasters',
  name: "Round Coasters (Nested)",
  desc: 'Round drink coasters (4" dia) nested 6-up for die-cutting with contour marks.',
  category: 'Commercial Print',
  sheetWIn: 11,
  sheetHIn: 17,
  steps: [
    { type: 'grid', s: { cols: 2, rows: 3, cellWIn: 4, cellHIn: 4, sheetWIn: 11, sheetHIn: 17, addMarks: true, centerMarks: true } },
    { type: 'cuttermarks', s: { shape: 'ellipse', cornersAndEdges: true } },
  ],
  preview: sizedGrid('cp-round-coasters', { cols: 2, rows: 3, cellWIn: 4, cellHIn: 4, sheetWIn: 11, sheetHIn: 17 }, { crop: true, reg: true, cut: true }),
});
