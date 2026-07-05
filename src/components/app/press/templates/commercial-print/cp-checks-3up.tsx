import { template, sizedGrid } from '../kit';

export default template({
  id: 'cp-checks-3up',
  name: "Business Checks (3-Up)",
  desc: 'Standard 3-up business checks on Letter stock. MICR-safe layout with perforation marks.',
  category: 'Commercial Print',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'grid', s: { cols: 1, rows: 3, cellWIn: 8, cellHIn: 3.5, sheetWIn: 8.5, sheetHIn: 11, addMarks: true, centerMarks: true } },
    { type: 'barcode' },
  ],
  preview: sizedGrid('cp-checks-3up', { cols: 1, rows: 3, cellWIn: 8, cellHIn: 3.5, sheetWIn: 8.5, sheetHIn: 11 }, { crop: true }),
});
