import { template, grid } from '../kit';

export default template({
  id: 'lf-tiled-poster',
  name: "Tiled Poster (A4 tiles to A0)",
  desc: 'Tiles a large poster across multiple sheets. Each source page fills one cell in an 4×2 grid.',
  category: 'Large Format',
  sheetWIn: 16.54,
  sheetHIn: 23.4,
  steps: [
    { type: 'grid', s: { cols: 2, rows: 4, sheetWIn: 16.54, sheetHIn: 23.4, addMarks: true, centerMarks: true } },
  ],
  preview: grid('lf-tiled-poster', 2, 4, { crop: true }),
});
