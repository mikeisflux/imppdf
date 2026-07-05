import { template, sizedGrid } from '../kit';

export default template({
  id: 'pk-spice-labels',
  name: "Spice Labels (Nested)",
  desc: 'Spice-jar labels (2×1.5") nested for material efficiency with die lines.',
  category: 'Packaging',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'stickers', s: { cols: 3, rows: 5, cellWIn: 2, cellHIn: 1.5, sheetWIn: 8.5, sheetHIn: 11, addMarks: true, centerMarks: true } },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: sizedGrid('pk-spice-labels', { cols: 3, rows: 5, cellWIn: 2, cellHIn: 1.5, sheetWIn: 8.5, sheetHIn: 11 }, { crop: true, reg: true, cut: true }),
});
