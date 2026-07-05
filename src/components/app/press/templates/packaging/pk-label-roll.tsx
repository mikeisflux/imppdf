import { template, sizedGrid } from '../kit';

export default template({
  id: 'pk-label-roll',
  name: "Label Roll (Continuous)",
  desc: 'Continuous roll labels with die lines and registration for a plotter.',
  category: 'Packaging',
  sheetWIn: 4,
  sheetHIn: 12,
  steps: [
    { type: 'stickers', s: { cols: 1, rows: 5, cellWIn: 3, cellHIn: 2, sheetWIn: 4, sheetHIn: 12, addMarks: true, centerMarks: true } },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: sizedGrid('pk-label-roll', { cols: 1, rows: 5, cellWIn: 3, cellHIn: 2, sheetWIn: 4, sheetHIn: 12 }, { crop: true, reg: true, cut: true }),
});
