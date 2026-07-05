import { template, sizedGrid } from '../kit';

export default template({
  id: 'cp-14up-bcards-tab',
  name: "14-Up Business Cards (Tabloid)",
  desc: 'Production-run business cards ganged 14-up on 11×17" tabloid for commercial offset.',
  category: 'Commercial Print',
  sheetWIn: 11,
  sheetHIn: 17,
  steps: [
    { type: 'grid', s: { cols: 2, rows: 7, cellWIn: 3.5, cellHIn: 2, sheetWIn: 11, sheetHIn: 17, addMarks: true, centerMarks: true } },
  ],
  preview: sizedGrid('cp-14up-bcards-tab', { cols: 2, rows: 7, cellWIn: 3.5, cellHIn: 2, sheetWIn: 11, sheetHIn: 17 }, { crop: true }),
});
