import { template, sizedGrid } from '../kit';

export default template({
  id: 'pk-cosmetic-box',
  name: "Cosmetic Box Flats",
  desc: 'Cosmetic folding-carton flats (4×6") 4-up positioned on the die with trim.',
  category: 'Packaging',
  sheetWIn: 11,
  sheetHIn: 17,
  steps: [
    { type: 'grid', s: { cols: 2, rows: 2, cellWIn: 4, cellHIn: 6, sheetWIn: 11, sheetHIn: 17, addMarks: true, centerMarks: true } },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: sizedGrid('pk-cosmetic-box', { cols: 2, rows: 2, cellWIn: 4, cellHIn: 6, sheetWIn: 11, sheetHIn: 17 }, { crop: true, reg: true, cut: true }),
});
