import { template, single } from '../kit';

export default template({
  id: 'lf-table-runner',
  name: "Table Runner (30×72\")",
  desc: 'Conference table runner at 30×72" for 6ft tables. Resized for large-format output.',
  category: 'Large Format',
  sheetWIn: 30,
  sheetHIn: 72,
  steps: [
    { type: 'resize', s: { sheetWIn: 30, sheetHIn: 72, addMarks: true, centerMarks: true } },
  ],
  preview: single('lf-table-runner', { crop: true }),
});
