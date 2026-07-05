import { template, sizedGrid } from '../kit';

export default template({
  id: 'vd-conf-badges-qr',
  name: "Conference Badges (QR)",
  desc: 'Name badges with unique QR codes from CSV, 4-up on A4.',
  category: 'Variable Data',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'datamerge', s: { cols: 2, rows: 4, cellWIn: 3.5, cellHIn: 2.25, sheetWIn: 8.5, sheetHIn: 11, addMarks: true, centerMarks: true } },
    { type: 'barcode', s: { symbology: 'qr' } },
  ],
  preview: sizedGrid('vd-conf-badges-qr', { cols: 2, rows: 4, cellWIn: 3.5, cellHIn: 2.25, sheetWIn: 8.5, sheetHIn: 11 }, { crop: true }),
});
