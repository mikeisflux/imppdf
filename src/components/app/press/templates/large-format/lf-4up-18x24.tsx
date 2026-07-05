import { template, grid } from '../kit';

export default template({
  id: 'lf-4up-18x24',
  name: "4-Up 18×24\"",
  desc: 'Four 18×24" posters ganged on an oversized sheet.',
  category: 'Large Format',
  sheetWIn: 36,
  sheetHIn: 48,
  steps: [
    { type: 'grid', s: { cols: 2, rows: 2, cellWIn: 18, cellHIn: 24, sheetWIn: 36, sheetHIn: 48, addMarks: true, centerMarks: true } },
  ],
  preview: grid('lf-4up-18x24', 2, 2, { crop: true }),
});
