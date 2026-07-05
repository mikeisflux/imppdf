import { template, grid } from '../kit';

export default template({
  id: 'pk-printcut-decals',
  name: "Print & Cut Vinyl Decals",
  desc: 'Print-and-cut vinyl decals nested with contour cut and registration.',
  category: 'Packaging',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'stickers', s: { cols: 3, rows: 4, cellWIn: 2.2, cellHIn: 2.2, sheetWIn: 8.5, sheetHIn: 11, addMarks: true, centerMarks: true } },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: grid('pk-printcut-decals', 3, 4, { crop: true, reg: true, cut: true }),
});
