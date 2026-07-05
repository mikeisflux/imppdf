import { template, sizedGrid } from '../kit';

export default template({
  id: 'lf-2up-movie',
  name: "2-Up Movie Posters (27×40\")",
  desc: 'Standard one-sheet cinema posters ganged 2-up on 54×40" wide-format stock.',
  category: 'Large Format',
  sheetWIn: 27,
  sheetHIn: 80,
  steps: [
    { type: 'grid', s: { cols: 1, rows: 2, cellWIn: 27, cellHIn: 40, sheetWIn: 27, sheetHIn: 80, addMarks: true, centerMarks: true } },
  ],
  preview: sizedGrid('lf-2up-movie', { cols: 1, rows: 2, cellWIn: 27, cellHIn: 40, sheetWIn: 27, sheetHIn: 80 }, { crop: true }),
});
