import { template, sizedGrid } from '../kit';

export default template({
  id: 'lf-roll-vinyl-24',
  name: "Roll Vinyl Sticker Sheet (24\")",
  desc: '24" roll vinyl sticker sheet with contour cut and registration.',
  category: 'Large Format',
  sheetWIn: 24,
  sheetHIn: 36,
  steps: [
    { type: 'stickers', s: { cols: 4, rows: 5, cellWIn: 5, cellHIn: 5, sheetWIn: 24, sheetHIn: 36, addMarks: true, centerMarks: true } },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: sizedGrid('lf-roll-vinyl-24', { cols: 4, rows: 5, cellWIn: 5, cellHIn: 5, sheetWIn: 24, sheetHIn: 36 }, { crop: true, reg: true, cut: true }),
});
