import { template, grid } from '../kit';

export default template({
  id: 're-openhouse-yard',
  name: "Open-House Yard Sign 2-Up (18×24\")",
  desc: 'Two 18×24" open-house / for-sale yard signs ganged on a 36×24" large-format sheet.',
  category: 'Real Estate',
  sheetWIn: 18,
  sheetHIn: 48,
  steps: [
    { type: 'grid', s: { cols: 1, rows: 2, cellWIn: 18, cellHIn: 24, sheetWIn: 18, sheetHIn: 48, addMarks: true, centerMarks: true } },
  ],
  preview: grid('re-openhouse-yard', 1, 2, { crop: true }),
});
