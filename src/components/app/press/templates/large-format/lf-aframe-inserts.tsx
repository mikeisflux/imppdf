import { template, sizedGrid } from '../kit';

export default template({
  id: 'lf-aframe-inserts',
  name: "A-Frame Sign Inserts",
  desc: 'Sidewalk A-frame sign inserts at 24×36" with double-sided printing.',
  category: 'Large Format',
  sheetWIn: 24,
  sheetHIn: 36,
  steps: [
    { type: 'grid', s: { cols: 1, rows: 2, cellWIn: 24, cellHIn: 18, sheetWIn: 24, sheetHIn: 36, addMarks: true, centerMarks: true } },
  ],
  preview: sizedGrid('lf-aframe-inserts', { cols: 1, rows: 2, cellWIn: 24, cellHIn: 18, sheetWIn: 24, sheetHIn: 36 }, { crop: true }),
});
