import { template, grid } from '../kit';

export default template({
  id: 'pk-seed-packets',
  name: "Seed Packets (6-Up)",
  desc: 'Small seed packets (3×4.5") ganged 6-up on Tabloid with crop marks.',
  category: 'Packaging',
  sheetWIn: 11,
  sheetHIn: 17,
  steps: [
    { type: 'grid', s: { cols: 2, rows: 3, cellWIn: 3, cellHIn: 4.5, sheetWIn: 11, sheetHIn: 17, addMarks: true, centerMarks: true } },
  ],
  preview: grid('pk-seed-packets', 2, 3, { crop: true }),
});
