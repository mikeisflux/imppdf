import { template, grid } from '../kit';

export default template({
  id: 'lf-steprepeat-photo',
  name: "Step-and-Repeat Photo Print",
  desc: 'Fill a sheet with identical photos. Perfect for passport photos, photo booth strips, and proofing.',
  category: 'Large Format',
  sheetWIn: 13,
  sheetHIn: 24,
  steps: [
    { type: 'grid', s: { cols: 2, rows: 3, cellWIn: 5, cellHIn: 7, order: 'repeat', sheetWIn: 13, sheetHIn: 24, addMarks: true, centerMarks: true } },
  ],
  preview: grid('lf-steprepeat-photo', 2, 3, { crop: true }),
});
