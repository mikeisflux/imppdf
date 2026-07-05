import { template, sizedGrid } from '../kit';

export default template({
  id: 'of-4up-index',
  name: "4-Up Index Cards (3×5\")",
  desc: 'Study flashcards or index cards, 4-up on Letter for cutting.',
  category: 'Office',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'grid', s: { cols: 2, rows: 2, cellWIn: 3, cellHIn: 5, sheetWIn: 8.5, sheetHIn: 11, addMarks: true, centerMarks: true } },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: sizedGrid('of-4up-index', { cols: 2, rows: 2, cellWIn: 3, cellHIn: 5, sheetWIn: 8.5, sheetHIn: 11 }, { crop: true, reg: true, cut: true }),
});
