import { template, sizedGrid } from '../kit';

// Tri-Fold Brochure 2-Up — two 11×8.5 landscape brochure sides stacked on
// tabloid, each scored into 3 fold panels. Reference: catalog.ts t039.
export default template({
  id: 'cp-trifold-2up',
  name: "Tri-Fold Brochure 2-Up",
  desc: 'Imposes two copies of each finished tri-fold brochure side on tabloid/A3-style duplex sheets.',
  category: 'Commercial Print',
  sheetWIn: 11,
  sheetHIn: 17,
  steps: [
    { type: 'grid', s: { cols: 1, rows: 2, cellWIn: 11, cellHIn: 8.5, duplex: true, duplexFlip: 'long', sheetWIn: 11, sheetHIn: 17, addMarks: true, centerMarks: true } },
    { type: 'foldmarks', s: { scheme: 'trifold' } },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: sizedGrid('cp-trifold-2up', { cols: 1, rows: 2, cellWIn: 11, cellHIn: 8.5, sheetWIn: 11, sheetHIn: 17, foldV: 3 }, { crop: true, reg: true, cut: true }),
});
