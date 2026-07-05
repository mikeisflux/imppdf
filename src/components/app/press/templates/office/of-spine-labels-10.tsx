import { template, grid } from '../kit';

export default template({
  id: 'of-spine-labels-10',
  name: "Binder Spine Labels (10-Up)",
  desc: '1" binder spine labels printed 10-up on Letter. Standard 3-ring binder spine width.',
  category: 'Office',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'grid', s: { cols: 2, rows: 5, cellWIn: 3.5, cellHIn: 1, sheetWIn: 8.5, sheetHIn: 11, addMarks: true, centerMarks: true } },
  ],
  preview: grid('of-spine-labels-10', 2, 5, { crop: true }),
});
