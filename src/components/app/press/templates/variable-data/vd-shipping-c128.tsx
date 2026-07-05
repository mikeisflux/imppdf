import { template, grid } from '../kit';

export default template({
  id: 'vd-shipping-c128',
  name: "Shipping Labels (Code 128)",
  desc: 'Shipping labels with unique Code 128 barcodes, 10-up on Letter.',
  category: 'Variable Data',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'datamerge', s: { cols: 2, rows: 3, cellWIn: 4, cellHIn: 3, sheetWIn: 8.5, sheetHIn: 11, addMarks: true, centerMarks: true } },
    { type: 'barcode', s: { symbology: 'code128' } },
  ],
  preview: grid('vd-shipping-c128', 2, 3, { crop: true }),
});
