import { template, sizedGrid } from '../kit';

export default template({
  id: 'of-name-badges-8',
  name: "Name Badges (8-Up)",
  desc: 'Conference name badges (3.5×2.25") printed 8-up on Letter for badge holders.',
  category: 'Office',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'grid', s: { cols: 2, rows: 4, cellWIn: 3.5, cellHIn: 2.25, sheetWIn: 8.5, sheetHIn: 11, addMarks: true, centerMarks: true } },
  ],
  preview: sizedGrid('of-name-badges-8', { cols: 2, rows: 4, cellWIn: 3.5, cellHIn: 2.25, sheetWIn: 8.5, sheetHIn: 11 }, { crop: true }),
});
