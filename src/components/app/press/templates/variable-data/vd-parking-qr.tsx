import { template, grid } from '../kit';

export default template({
  id: 'vd-parking-qr',
  name: "Parking Permits (QR Code)",
  desc: 'Parking permits with unique QR validation codes, 4-up on Letter.',
  category: 'Variable Data',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'datamerge', s: { cols: 2, rows: 2, cellWIn: 4, cellHIn: 5, sheetWIn: 8.5, sheetHIn: 11, addMarks: true, centerMarks: true } },
    { type: 'barcode', s: { symbology: 'qr' } },
  ],
  preview: grid('vd-parking-qr', 2, 2, { crop: true }),
});
