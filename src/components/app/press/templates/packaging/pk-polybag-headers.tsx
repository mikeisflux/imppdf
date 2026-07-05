import { template, sizedGrid } from '../kit';

export default template({
  id: 'pk-polybag-headers',
  name: "Poly Bag Headers (6-Up)",
  desc: 'Retail poly bag header cards (4×2.5") printed 6-up on Letter with hang-hole marks.',
  category: 'Packaging',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'grid', s: { cols: 2, rows: 3, cellWIn: 4, cellHIn: 3, sheetWIn: 8.5, sheetHIn: 11, addMarks: true, centerMarks: true } },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: sizedGrid('pk-polybag-headers', { cols: 2, rows: 3, cellWIn: 4, cellHIn: 3, sheetWIn: 8.5, sheetHIn: 11 }, { crop: true, reg: true, cut: true }),
});
