import { template, sizedGrid } from '../kit';

export default template({
  id: 'vd-gift-qr',
  name: "Gift Vouchers (QR Code)",
  desc: 'Gift vouchers with unique QR redemption codes, 2-up on A4.',
  category: 'Variable Data',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'datamerge', s: { cols: 2, rows: 4, cellWIn: 4, cellHIn: 2, sheetWIn: 8.5, sheetHIn: 11, addMarks: true, centerMarks: true } },
    { type: 'barcode', s: { symbology: 'qr' } },
  ],
  preview: sizedGrid('vd-gift-qr', { cols: 2, rows: 4, cellWIn: 4, cellHIn: 2, sheetWIn: 8.5, sheetHIn: 11 }, { crop: true }),
});
