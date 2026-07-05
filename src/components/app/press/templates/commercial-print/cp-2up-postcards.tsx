import { template, sizedGrid } from '../kit';

// 2-Up Postcards (4×6") — two USPS 6×4 landscape postcards stacked on Letter,
// drawn at true scale so the 6×4 size reads correctly against the sheet.
// Reference: catalog.ts t006.
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
  preview: sizedGrid('cp-2up-postcards', { cols: 1, rows: 2, cellWIn: 6, cellHIn: 4, sheetWIn: 8.5, sheetHIn: 11 }, { crop: true }),
});
