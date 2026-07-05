import { template, grid } from '../kit';

export default template({
  id: 'pk-corrugated',
  name: "Corrugated Shipper Flat",
  desc: 'Corrugated shipper box flat (10×16") with cut contour on the die.',
  category: 'Packaging',
  sheetWIn: 11,
  sheetHIn: 17,
  steps: [
    { type: 'grid', s: { cols: 1, rows: 1, cellWIn: 10, cellHIn: 16, sheetWIn: 11, sheetHIn: 17, addMarks: true, centerMarks: true } },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: grid('pk-corrugated', 1, 1, { crop: true, reg: true, cut: true }),
});
