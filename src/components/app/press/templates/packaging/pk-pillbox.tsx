import { template, sizedGrid } from '../kit';

export default template({
  id: 'pk-pillbox',
  name: "Pill Box Flat Pattern",
  desc: 'Pharmaceutical pill-box carton flat with fold marks and die.',
  category: 'Packaging',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'grid', s: { cols: 1, rows: 1, cellWIn: 6, cellHIn: 8, sheetWIn: 8.5, sheetHIn: 11, addMarks: true, centerMarks: true } },
    { type: 'foldmarks', s: { scheme: 'custom' } },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: sizedGrid('pk-pillbox', { cols: 1, rows: 1, cellWIn: 6, cellHIn: 8, sheetWIn: 8.5, sheetHIn: 11 }, { crop: true, reg: true, cut: true }),
});
