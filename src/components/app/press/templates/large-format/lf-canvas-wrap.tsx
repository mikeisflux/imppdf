import { template, sizedGrid } from '../kit';

export default template({
  id: 'lf-canvas-wrap',
  name: "Canvas Wrap Print Tiling",
  desc: 'Gallery-wrap canvas tiles auto-scaled in a 2×2 grid for large art prints.',
  category: 'Large Format',
  sheetWIn: 24,
  sheetHIn: 24,
  steps: [
    { type: 'grid', s: { cols: 1, rows: 1, cellWIn: 20, cellHIn: 20, sheetWIn: 24, sheetHIn: 24, addMarks: true, centerMarks: true } },
  ],
  preview: sizedGrid('lf-canvas-wrap', { cols: 1, rows: 1, cellWIn: 20, cellHIn: 20, sheetWIn: 24, sheetHIn: 24 }, { crop: true }),
});
