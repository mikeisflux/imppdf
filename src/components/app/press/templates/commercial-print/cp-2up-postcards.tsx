import { template, grid } from '../kit';

export default template({
  id: 'cp-2up-postcards',
  name: "2-Up Postcards (4×6\")",
  desc: 'USPS-standard 4×6" postcards, 2-up on Letter for desktop or short-run digital.',
  category: 'Commercial Print',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'grid', s: { cols: 1, rows: 2, cellWIn: 6, cellHIn: 4, sheetWIn: 8.5, sheetHIn: 11, addMarks: true, centerMarks: true } },
  ],
  preview: grid('cp-2up-postcards', 1, 2, { crop: true }),
});
