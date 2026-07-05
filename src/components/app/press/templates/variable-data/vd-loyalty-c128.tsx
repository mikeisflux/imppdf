import { template, sizedGrid } from '../kit';

export default template({
  id: 'vd-loyalty-c128',
  name: "Loyalty Cards (Code 128)",
  desc: 'Loyalty/membership cards with unique Code 128 barcodes, 10-up on Letter.',
  category: 'Variable Data',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'datamerge', s: { cols: 2, rows: 5, cellWIn: 3.5, cellHIn: 2, sheetWIn: 8.5, sheetHIn: 11, addMarks: true, centerMarks: true } },
    { type: 'barcode', s: { symbology: 'code128' } },
  ],
  preview: sizedGrid('vd-loyalty-c128', { cols: 2, rows: 5, cellWIn: 3.5, cellHIn: 2, sheetWIn: 8.5, sheetHIn: 11 }, { crop: true }),
});
