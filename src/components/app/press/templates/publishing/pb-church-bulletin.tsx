import { template, booklet } from '../kit';

export default template({
  id: 'pb-church-bulletin',
  name: "16-Page Church Bulletin (A4)",
  desc: 'Saddle-stitched A4 bulletin on A3 landscape. Standard for weekly church programs.',
  category: 'Publishing',
  sheetWIn: 8.27,
  sheetHIn: 11.69,
  steps: [
    { type: 'booklet', s: { sheetWIn: 11.69, sheetHIn: 8.27 } },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: booklet('pb-church-bulletin', { reg: true, cut: true }),
});
