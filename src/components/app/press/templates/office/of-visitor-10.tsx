import { template, sizedGrid } from '../kit';

export default template({
  id: 'of-visitor-10',
  name: "Visitor Passes (10-Up)",
  desc: 'Business-card-size visitor passes (3.5×2") printed 10-up on Letter stock.',
  category: 'Office',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'grid', s: { cols: 2, rows: 5, cellWIn: 3.5, cellHIn: 2, sheetWIn: 8.5, sheetHIn: 11, addMarks: true, centerMarks: true } },
  ],
  preview: sizedGrid('of-visitor-10', { cols: 2, rows: 5, cellWIn: 3.5, cellHIn: 2, sheetWIn: 8.5, sheetHIn: 11 }, { crop: true }),
});
