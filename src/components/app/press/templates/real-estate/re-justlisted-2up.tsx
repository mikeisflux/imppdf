import { template, sizedGrid } from '../kit';

export default template({
  id: 're-justlisted-2up',
  name: "Just-Listed Flyer 2-Up (8.5×5.5\")",
  desc: 'Half-sheet landscape just-listed flyers, 2-up on Letter for feature sheets and open-house handouts.',
  category: 'Real Estate',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'grid', s: { cols: 1, rows: 2, cellWIn: 8.5, cellHIn: 5.5, sheetWIn: 8.5, sheetHIn: 11, addMarks: true, centerMarks: true } },
  ],
  preview: sizedGrid('re-justlisted-2up', { cols: 1, rows: 2, cellWIn: 8.5, cellHIn: 5.5, sheetWIn: 8.5, sheetHIn: 11 }, { crop: true }),
});
