import { template, bookSheet } from '../kit';

// Comic Book (A5) — saddle-stitched A5 (5.8×8.3") single-issue comic, imposed
// 2-up on 11×17 with trim marks.
export default template({
  id: 'pb-comic-a5',
  name: 'Comic Book (A5)',
  desc: 'Saddle-stitched A5 (5.8×8.3") single-issue comic, imposed 2-up on 11×17.',
  category: 'Publishing',
  sheetWIn: 17,
  sheetHIn: 11,
  steps: [
    { type: 'booklet', s: { sheetWIn: 17, sheetHIn: 11 } },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: bookSheet('pb-comic-a5', { trimWIn: 5.8, trimHIn: 8.3, sheetWIn: 17, sheetHIn: 11 }, { saddle: true, crop: true, reg: true, cut: true }),
});
