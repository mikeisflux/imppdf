import { template, sizedGrid } from '../kit';

export default template({
  id: 'pk-blister-4up',
  name: "Blister Card 4-Up",
  desc: 'Retail blister packaging cards (3.5×5") ganged 4-up on Tabloid with dieline paths.',
  category: 'Packaging',
  sheetWIn: 11,
  sheetHIn: 17,
  steps: [
    { type: 'grid', s: { cols: 2, rows: 2, cellWIn: 5, cellHIn: 7, sheetWIn: 11, sheetHIn: 17, addMarks: true, centerMarks: true } },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
    { type: 'regmarks' },
  ],
  preview: sizedGrid('pk-blister-4up', { cols: 2, rows: 2, cellWIn: 5, cellHIn: 7, sheetWIn: 11, sheetHIn: 17 }, { crop: true, reg: true, cut: true }),
});
