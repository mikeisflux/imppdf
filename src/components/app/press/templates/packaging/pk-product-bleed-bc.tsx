import { template, sizedGrid } from '../kit';

export default template({
  id: 'pk-product-bleed-bc',
  name: "Product Labels with Bleed & Barcode",
  desc: 'Add bleed, gang labels (3×4") 4-up, stamp a barcode, then add die lines.',
  category: 'Packaging',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'bleed', s: { bleedIn: 0.125 } },
    { type: 'grid', s: { cols: 2, rows: 2, cellWIn: 3, cellHIn: 4, sheetWIn: 8.5, sheetHIn: 11, bleedMode: 'fixed', bleedIn: 0.125, addMarks: true, centerMarks: true } },
    { type: 'barcode' },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: sizedGrid('pk-product-bleed-bc', { cols: 2, rows: 2, cellWIn: 3, cellHIn: 4, sheetWIn: 8.5, sheetHIn: 11 }, { crop: true, reg: true, cut: true }),
});
