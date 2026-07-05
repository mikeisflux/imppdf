import { template, grid } from '../kit';

export default template({
  id: 'cp-4up-rackcards',
  name: "4-Up Rack Cards (3.5×7\")",
  desc: 'Vertical rack cards (3.5×7") ganged 4-up on Tabloid.',
  category: 'Commercial Print',
  sheetWIn: 11,
  sheetHIn: 17,
  steps: [
    { type: 'grid', s: { cols: 2, rows: 2, cellWIn: 3.5, cellHIn: 7, sheetWIn: 11, sheetHIn: 17, addMarks: true, centerMarks: true } },
  ],
  preview: grid('cp-4up-rackcards', 2, 2, { crop: true }),
});
