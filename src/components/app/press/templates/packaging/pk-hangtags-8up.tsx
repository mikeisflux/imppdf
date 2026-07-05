import { template, grid } from '../kit';

export default template({
  id: 'pk-hangtags-8up',
  name: "Hang Tags 8-Up (2.5×4\")",
  desc: 'Retail garment hang tags ganged 8-up on Tabloid with die-cut contour paths.',
  category: 'Packaging',
  sheetWIn: 11,
  sheetHIn: 17,
  steps: [
    { type: 'grid', s: { cols: 2, rows: 4, cellWIn: 2.5, cellHIn: 4, sheetWIn: 11, sheetHIn: 17, addMarks: true, centerMarks: true } },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
    { type: 'barcode' },
  ],
  preview: grid('pk-hangtags-8up', 2, 4, { crop: true, reg: true, cut: true }),
});
