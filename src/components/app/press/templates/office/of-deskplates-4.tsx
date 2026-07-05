import { template, grid } from '../kit';

export default template({
  id: 'of-deskplates-4',
  name: "Desk Name Plates (4-Up)",
  desc: 'Folding desk name plates (8×2" flat) printed 4-up on Letter.',
  category: 'Office',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'grid', s: { cols: 1, rows: 4, cellWIn: 8, cellHIn: 2, sheetWIn: 8.5, sheetHIn: 11, addMarks: true, centerMarks: true } },
  ],
  preview: grid('of-deskplates-4', 1, 4, { crop: true }),
});
