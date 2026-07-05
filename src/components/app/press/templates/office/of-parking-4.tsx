import { template, sizedGrid } from '../kit';

export default template({
  id: 'of-parking-4',
  name: "Parking Permits (4-Up)",
  desc: 'Parking permits / hang tags (3.5×5") printed 4-up on Letter stock.',
  category: 'Office',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'grid', s: { cols: 2, rows: 2, cellWIn: 4, cellHIn: 5, sheetWIn: 8.5, sheetHIn: 11, addMarks: true, centerMarks: true } },
  ],
  preview: sizedGrid('of-parking-4', { cols: 2, rows: 2, cellWIn: 4, cellHIn: 5, sheetWIn: 8.5, sheetHIn: 11 }, { crop: true }),
});
