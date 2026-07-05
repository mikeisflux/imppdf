import { template, sizedGrid } from '../kit';

export default template({
  id: 're-justlisted-4up',
  name: "Just-Listed Flyer 4-Up (4.25×5.5\")",
  desc: 'Quarter-sheet just-listed flyers, 4-up on Letter — the cheapest way to print open-house handouts.',
  category: 'Real Estate',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'grid', s: { cols: 2, rows: 2, cellWIn: 4.25, cellHIn: 5.5, sheetWIn: 8.5, sheetHIn: 11, addMarks: true, centerMarks: true } },
  ],
  preview: sizedGrid('re-justlisted-4up', { cols: 2, rows: 2, cellWIn: 4.25, cellHIn: 5.5, sheetWIn: 8.5, sheetHIn: 11 }, { crop: true }),
});
