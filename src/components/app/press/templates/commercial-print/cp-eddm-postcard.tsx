import { template, sizedGrid } from '../kit';

export default template({
  id: 'cp-eddm-postcard',
  name: "EDDM Postcard (6.25×9\")",
  desc: 'USPS Every Door Direct Mail oversized postcard on 13×19" stock.',
  category: 'Commercial Print',
  sheetWIn: 13,
  sheetHIn: 19,
  steps: [
    { type: 'grid', s: { cols: 2, rows: 1, cellWIn: 6.25, cellHIn: 9, sheetWIn: 13, sheetHIn: 19, addMarks: true, centerMarks: true } },
    { type: 'barcode' },
  ],
  preview: sizedGrid('cp-eddm-postcard', { cols: 2, rows: 1, cellWIn: 6.25, cellHIn: 9, sheetWIn: 13, sheetHIn: 19 }, { crop: true }),
});
