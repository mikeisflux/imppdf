import { template, sizedGrid } from '../kit';

export default template({
  id: 'pk-folding-carton',
  name: "Folding Carton Dieline",
  desc: 'Folding carton box flat positioned on the die-line for die-cutting.',
  category: 'Packaging',
  sheetWIn: 11,
  sheetHIn: 17,
  steps: [
    { type: 'grid', s: { cols: 1, rows: 1, cellWIn: 9, cellHIn: 14, sheetWIn: 11, sheetHIn: 17, addMarks: true, centerMarks: true } },
    { type: 'cuttermarks', s: { addDielines: true, cornersAndEdges: true } },
  ],
  preview: sizedGrid('pk-folding-carton', { cols: 1, rows: 1, cellWIn: 9, cellHIn: 14, sheetWIn: 11, sheetHIn: 17 }, { crop: true, reg: true, cut: true }),
});
