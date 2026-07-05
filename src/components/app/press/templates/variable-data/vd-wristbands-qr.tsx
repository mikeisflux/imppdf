import { template, sizedGrid } from '../kit';

export default template({
  id: 'vd-wristbands-qr',
  name: "Wristbands (QR Code)",
  desc: 'Event wristbands with unique QR codes, 8-up on Letter.',
  category: 'Variable Data',
  sheetWIn: 11,
  sheetHIn: 11,
  steps: [
    { type: 'datamerge', s: { cols: 1, rows: 8, cellWIn: 10, cellHIn: 1, sheetWIn: 11, sheetHIn: 11, addMarks: true, centerMarks: true } },
    { type: 'barcode', s: { symbology: 'qr' } },
  ],
  preview: sizedGrid('vd-wristbands-qr', { cols: 1, rows: 8, cellWIn: 10, cellHIn: 1, sheetWIn: 11, sheetHIn: 11 }, { crop: true }),
});
