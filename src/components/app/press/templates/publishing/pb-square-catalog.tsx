import { template, booklet } from '../kit';

export default template({
  id: 'pb-square-catalog',
  name: "Square Catalog (8×8\")",
  desc: '8×8" square product catalog with saddle-stitch binding. Popular for retail and portfolio.',
  category: 'Publishing',
  sheetWIn: 16,
  sheetHIn: 8,
  steps: [
    { type: 'booklet', s: { sheetWIn: 16, sheetHIn: 8 } },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: booklet('pb-square-catalog', { reg: true, cut: true }),
});
