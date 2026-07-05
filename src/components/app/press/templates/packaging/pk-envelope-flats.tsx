import { template, grid } from '../kit';

export default template({
  id: 'pk-envelope-flats',
  name: "Envelope Flats 4-Up (#10)",
  desc: 'Standard #10 envelope flats (9.5×4.125") ganged 4-up on Tabloid with dieline paths.',
  category: 'Packaging',
  sheetWIn: 11,
  sheetHIn: 17,
  steps: [
    { type: 'grid', s: { cols: 2, rows: 2, cellWIn: 9.5, cellHIn: 4.125, sheetWIn: 11, sheetHIn: 17, addMarks: true, centerMarks: true } },
    { type: 'foldmarks', s: { scheme: 'custom' } },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: grid('pk-envelope-flats', 2, 2, { crop: true, reg: true, cut: true }),
});
