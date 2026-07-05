import { template, grid } from '../kit';

export default template({
  id: 'cp-3up-doorhangers',
  name: "3-Up Door Hangers",
  desc: '3.5×8.5" door hangers ganged 3-up across on Tabloid for die-cutting.',
  category: 'Commercial Print',
  sheetWIn: 11,
  sheetHIn: 17,
  steps: [
    { type: 'grid', s: { cols: 1, rows: 3, cellWIn: 3.5, cellHIn: 8.5, sheetWIn: 11, sheetHIn: 17, addMarks: true, centerMarks: true } },
  ],
  preview: grid('cp-3up-doorhangers', 1, 3, { crop: true }),
});
