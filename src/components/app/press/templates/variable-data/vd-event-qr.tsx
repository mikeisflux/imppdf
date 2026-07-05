import { template, sizedGrid } from '../kit';

export default template({
  id: 'vd-event-qr',
  name: "Event Tickets (QR Code)",
  desc: 'QR code tickets from CSV data, 2-up on Letter sheets for easy cutting.',
  category: 'Variable Data',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'datamerge', s: { cols: 2, rows: 4, cellWIn: 4, cellHIn: 2, sheetWIn: 8.5, sheetHIn: 11, addMarks: true, centerMarks: true } },
    { type: 'barcode', s: { symbology: 'qr' } },
  ],
  preview: sizedGrid('vd-event-qr', { cols: 2, rows: 4, cellWIn: 4, cellHIn: 2, sheetWIn: 8.5, sheetHIn: 11 }, { crop: true }),
});
