import { template, sizedGrid } from '../kit';

export default template({
  id: 're-justsold-4up',
  name: "Just-Sold Postcard 4-Up (4×6\")",
  desc: 'USPS-standard 4×6" just-sold / farming postcards, 4-up on Tabloid for short-run direct mail.',
  category: 'Real Estate',
  sheetWIn: 13,
  sheetHIn: 19,
  steps: [
    { type: 'grid', s: { cols: 2, rows: 2, cellWIn: 4, cellHIn: 6, sheetWIn: 13, sheetHIn: 19, addMarks: true, centerMarks: true } },
  ],
  preview: sizedGrid('re-justsold-4up', { cols: 2, rows: 2, cellWIn: 4, cellHIn: 6, sheetWIn: 13, sheetHIn: 19 }, { crop: true }),
});
