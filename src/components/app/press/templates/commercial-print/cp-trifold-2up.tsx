import { template, grid } from '../kit';

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
  preview: grid('cp-trifold-2up', 1, 2, { crop: true, reg: true, cut: true }),
});
