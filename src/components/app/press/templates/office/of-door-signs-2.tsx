import { template, grid } from '../kit';

export default template({
  id: 'of-door-signs-2',
  name: "Door Signs (2-Up)",
  desc: 'Do Not Disturb / office door signs (4×10") printed 2-up on Letter.',
  category: 'Office',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'grid', s: { cols: 1, rows: 2, cellWIn: 8.5, cellHIn: 5.5, sheetWIn: 8.5, sheetHIn: 11, addMarks: true, centerMarks: true } },
  ],
  preview: grid('of-door-signs-2', 1, 2, { crop: true }),
});
