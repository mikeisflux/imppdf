import { template, sizedGrid } from '../kit';

export default template({
  id: 'vd-product-ean13',
  name: "Product Labels (EAN-13)",
  desc: 'EAN-13 retail barcodes from CSV, 12-up on A4 for product labelling.',
  category: 'Variable Data',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'datamerge', s: { cols: 2, rows: 5, cellWIn: 3, cellHIn: 2, sheetWIn: 8.5, sheetHIn: 11, addMarks: true, centerMarks: true } },
    { type: 'barcode', s: { symbology: 'ean13' } },
  ],
  preview: sizedGrid('vd-product-ean13', { cols: 2, rows: 5, cellWIn: 3, cellHIn: 2, sheetWIn: 8.5, sheetHIn: 11 }, { crop: true }),
});
