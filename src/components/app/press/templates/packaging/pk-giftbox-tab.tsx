import { template, sizedGrid } from '../kit';

export default template({
  id: 'pk-giftbox-tab',
  name: "Gift Box Flat (Tabloid)",
  desc: 'Rigid gift-box flat (10×16") on Tabloid with cut contour.',
  category: 'Packaging',
  sheetWIn: 11,
  sheetHIn: 17,
  steps: [
    { type: 'grid', s: { cols: 1, rows: 1, cellWIn: 10, cellHIn: 16, sheetWIn: 11, sheetHIn: 17, addMarks: true, centerMarks: true } },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: sizedGrid('pk-giftbox-tab', { cols: 1, rows: 1, cellWIn: 10, cellHIn: 16, sheetWIn: 11, sheetHIn: 17 }, { crop: true, reg: true, cut: true }),
});
