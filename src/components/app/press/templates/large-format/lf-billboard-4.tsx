import { template, grid } from '../kit';

export default template({
  id: 'lf-billboard-4',
  name: "Billboard Tiles (4-Panel)",
  desc: 'Billboard artwork split into 4 printable panels.',
  category: 'Large Format',
  sheetWIn: 48,
  sheetHIn: 24,
  steps: [
    { type: 'grid', s: { cols: 2, rows: 2, cellWIn: 24, cellHIn: 12, sheetWIn: 48, sheetHIn: 24, addMarks: true, centerMarks: true } },
  ],
  preview: grid('lf-billboard-4', 2, 2, { crop: true }),
});
