import { template, booklet } from '../kit';

export default template({
  id: 'pb-childrens',
  name: "Children's Picture Book",
  desc: 'Full-color picture book signatures with color bars and trim marks.',
  category: 'Publishing',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'booklet', s: { signatureSheets: 4 } },
    { type: 'colorbar' },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: booklet('pb-childrens', { reg: true, cut: true, colorbar: true, saddle: false }),
});
