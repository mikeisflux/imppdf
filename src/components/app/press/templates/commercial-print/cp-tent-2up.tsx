import { template, sizedGrid } from '../kit';

export default template({
  id: 'cp-tent-2up',
  name: "Tent Card 2-Up",
  desc: 'Fold-in-half table tent cards (4.25×5.5" finished), 2-up on Letter for double-sided printing.',
  category: 'Commercial Print',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'grid', s: { cols: 1, rows: 2, cellWIn: 8, cellHIn: 3.5, duplex: true, duplexFlip: 'long', sheetWIn: 8.5, sheetHIn: 11, addMarks: true, centerMarks: true } },
    { type: 'foldmarks', s: { scheme: 'half' } },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: sizedGrid('cp-tent-2up', { cols: 1, rows: 2, cellWIn: 8, cellHIn: 3.5, sheetWIn: 8.5, sheetHIn: 11 }, { crop: true, reg: true, cut: true }),
});
