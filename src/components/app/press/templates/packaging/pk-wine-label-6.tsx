import { template, sizedGrid } from '../kit';

export default template({
  id: 'pk-wine-label-6',
  name: "Wine Bottle Label 6-Up",
  desc: 'Standard wine bottle labels (3.5×4") ganged 6-up on Tabloid with trim marks.',
  category: 'Packaging',
  sheetWIn: 11,
  sheetHIn: 17,
  steps: [
    { type: 'grid', s: { cols: 2, rows: 3, cellWIn: 3.5, cellHIn: 4, sheetWIn: 11, sheetHIn: 17, addMarks: true, centerMarks: true } },
    { type: 'distort' },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: sizedGrid('pk-wine-label-6', { cols: 2, rows: 3, cellWIn: 3.5, cellHIn: 4, sheetWIn: 11, sheetHIn: 17 }, { crop: true, reg: true, cut: true }),
});
