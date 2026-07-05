import { template, sizedGrid } from '../kit';

export default template({
  id: 'lf-label-roll-4',
  name: "Label Roll 4\"",
  desc: '4"-wide roll labels with contour cut and registration.',
  category: 'Large Format',
  sheetWIn: 4,
  sheetHIn: 14,
  steps: [
    { type: 'stickers', s: { cols: 1, rows: 6, cellWIn: 3, cellHIn: 2, sheetWIn: 4, sheetHIn: 14, addMarks: true, centerMarks: true } },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: sizedGrid('lf-label-roll-4', { cols: 1, rows: 6, cellWIn: 3, cellHIn: 2, sheetWIn: 4, sheetHIn: 14 }, { crop: true, reg: true, cut: true }),
});
