import { template, signature } from '../kit';

// Comic Book (A5) — saddle-stitched A5 (5.8×8.3") single-issue comic, imposed
// 2-up on 11×17 with trim marks.
export default template({
  id: 'pb-comic-a5',
  name: 'Comic Book (A5)',
  desc: 'Saddle-stitched A5 (5.8×8.3") single-issue comic, imposed 2-up on 11×17.',
  category: 'Publishing',
  sheetWIn: 11.6,
  sheetHIn: 16.6,
  steps: [
    { type: 'booklet', s: { sheetWIn: 17, sheetHIn: 11 } },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: signature('pb-comic-a5', { cols: 2, rows: 2, crop: true, reg: true, cut: true }),
});
