import { template, grid } from '../kit';

export default template({
  id: 'lf-banner-tiles-4',
  name: "Banner Tiles 4-Up (24×36\")",
  desc: 'Four 24×36" banner panels on a single 96×36" wide-format sheet for trade show displays.',
  category: 'Large Format',
  sheetWIn: 24,
  sheetHIn: 36,
  steps: [
    { type: 'grid', s: { cols: 2, rows: 2, cellWIn: 12, cellHIn: 18, sheetWIn: 24, sheetHIn: 36, addMarks: true, centerMarks: true } },
  ],
  preview: grid('lf-banner-tiles-4', 2, 2, { crop: true }),
});
