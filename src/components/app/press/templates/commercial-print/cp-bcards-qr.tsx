import { template, grid } from '../kit';

export default template({
  id: 'cp-bcards-qr',
  name: "Business Cards with QR Code",
  desc: '10-up business cards on Letter with a QR code on the back — links to website or vCard.',
  category: 'Commercial Print',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'barcode', s: { symbology: 'qr' } },
    { type: 'grid', s: { cols: 2, rows: 5, cellWIn: 3.5, cellHIn: 2, sheetWIn: 8.5, sheetHIn: 11, addMarks: true, centerMarks: true } },
  ],
  preview: grid('cp-bcards-qr', 2, 5, { crop: true }),
});
