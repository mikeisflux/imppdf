import { template, booklet } from '../kit';

export default template({
  id: 'pb-concert-a5',
  name: "Concert Program (A5)",
  desc: 'A5 saddle-stitched concert or theater program. 12-16 pages typical, fits in pocket.',
  category: 'Publishing',
  sheetWIn: 11.69,
  sheetHIn: 8.27,
  steps: [
    { type: 'booklet', s: { sheetWIn: 11.69, sheetHIn: 8.27 } },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: booklet('pb-concert-a5', { reg: true, cut: true }),
});
