import { template, grid } from '../kit';

export default template({
  id: 'cp-trifold-letter',
  name: "Tri-Fold Brochure (Letter)",
  desc: 'Standard tri-fold brochure on Letter stock. 6 panels (3 front, 3 back) with fold marks.',
  category: 'Commercial Print',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'grid', s: { cols: 1, rows: 1, cellWIn: 8.5, cellHIn: 11, sheetWIn: 8.5, sheetHIn: 11, addMarks: true, centerMarks: true } },
    { type: 'foldmarks', s: { scheme: 'trifold' } },
  ],
  preview: grid('cp-trifold-letter', 1, 1, { crop: true }),
});
