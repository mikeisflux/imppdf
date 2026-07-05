import { template, sizedGrid } from '../kit';

export default template({
  id: 'lf-photo-backdrop',
  name: "Photo Backdrop (8×10 ft)",
  desc: '8×10 ft photo backdrop tiled for seamless assembly.',
  category: 'Large Format',
  sheetWIn: 96,
  sheetHIn: 120,
  steps: [
    { type: 'grid', s: { cols: 2, rows: 2, cellWIn: 48, cellHIn: 60, sheetWIn: 96, sheetHIn: 120, addMarks: true, centerMarks: true } },
  ],
  preview: sizedGrid('lf-photo-backdrop', { cols: 2, rows: 2, cellWIn: 48, cellHIn: 60, sheetWIn: 96, sheetHIn: 120 }, { crop: true }),
});
