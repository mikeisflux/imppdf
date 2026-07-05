import { template, grid } from '../kit';

export default template({
  id: 'cp-steprepeat-flyer',
  name: "Step-and-Repeat Flyer",
  desc: 'Fill a sheet with sequential flyer pages, auto-scaled to fit. Ideal for different-content handouts.',
  category: 'Commercial Print',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'grid', s: { cols: 1, rows: 1, cellWIn: 8.5, cellHIn: 11, order: 'repeat', sheetWIn: 8.5, sheetHIn: 11, addMarks: true, centerMarks: true } },
  ],
  preview: grid('cp-steprepeat-flyer', 1, 1, { crop: true }),
});
