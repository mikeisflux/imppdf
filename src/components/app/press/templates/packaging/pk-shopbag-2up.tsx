import { template, grid } from '../kit';

export default template({
  id: 'pk-shopbag-2up',
  name: "Shopping Bag Flat 2-Up",
  desc: 'Retail shopping bag flats 2-up on Tabloid with fold and die-cut paths.',
  category: 'Packaging',
  sheetWIn: 11,
  sheetHIn: 17,
  steps: [
    { type: 'grid', s: { cols: 1, rows: 2, cellWIn: 10, cellHIn: 7, sheetWIn: 11, sheetHIn: 17, addMarks: true, centerMarks: true } },
    { type: 'foldmarks', s: { scheme: 'custom' } },
  ],
  preview: grid('pk-shopbag-2up', 1, 2, { crop: true }),
});
