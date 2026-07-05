import { template, grid } from '../kit';

export default template({
  id: 'vd-asset-dm',
  name: "Asset Tags (DataMatrix)",
  desc: 'Compact DataMatrix asset tags, 10-up on Letter for inventory tracking.',
  category: 'Variable Data',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'datamerge', s: { cols: 3, rows: 8, cellWIn: 2, cellHIn: 1, sheetWIn: 8.5, sheetHIn: 11, addMarks: true, centerMarks: true } },
    { type: 'barcode', s: { symbology: 'datamatrix' } },
  ],
  preview: grid('vd-asset-dm', 3, 8, { crop: true }),
});
