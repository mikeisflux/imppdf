import { template, sizedGrid } from '../kit';

export default template({
  id: 'pk-sticker-a4',
  name: "Sticker Sheet A4 (Die-Cut)",
  desc: 'Full A4 sticker sheet with kiss-cut contours for peel-and-stick.',
  category: 'Packaging',
  sheetWIn: 8.27,
  sheetHIn: 11.69,
  steps: [
    { type: 'stickers', s: { cols: 3, rows: 4, cellWIn: 2, cellHIn: 2.5, sheetWIn: 8.27, sheetHIn: 11.69, addMarks: true, centerMarks: true } },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: sizedGrid('pk-sticker-a4', { cols: 3, rows: 4, cellWIn: 2, cellHIn: 2.5, sheetWIn: 8.27, sheetHIn: 11.69 }, { crop: true, reg: true, cut: true }),
});
