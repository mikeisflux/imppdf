import { template, grid } from '../kit';

export default template({
  id: 'of-bookmarks-6',
  name: "Bookmarks (6-Up)",
  desc: 'Standard bookmarks (2×6") printed 6-up on Letter stock.',
  category: 'Office',
  sheetWIn: 11,
  sheetHIn: 8.5,
  steps: [
    { type: 'grid', s: { cols: 6, rows: 1, cellWIn: 1.75, cellHIn: 7.5, sheetWIn: 11, sheetHIn: 8.5, addMarks: true, centerMarks: true } },
  ],
  preview: grid('of-bookmarks-6', 6, 1, { crop: true }),
});
