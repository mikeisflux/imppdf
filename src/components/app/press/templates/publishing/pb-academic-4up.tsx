import { template, booklet } from '../kit';

export default template({
  id: 'pb-academic-4up',
  name: "Academic Journal (4-Up)",
  desc: 'Academic journal signatures 4-up with gathering and trim marks.',
  category: 'Publishing',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'booklet', s: { signatureSheets: 4 } },
    { type: 'gathering' },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: booklet('pb-academic-4up', { reg: true, cut: true, saddle: false }),
});
