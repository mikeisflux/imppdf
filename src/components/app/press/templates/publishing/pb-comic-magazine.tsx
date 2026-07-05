import { template, signature } from '../kit';

// Comic Book (Magazine) — saddle-stitched 8×10.5" single-issue comic, imposed
// 2-up on 11×17 with trim marks.
export default template({
  id: 'pb-comic-magazine',
  name: 'Comic Book (Magazine)',
  desc: 'Saddle-stitched Magazine (8×10.5") single-issue comic, imposed 2-up on 11×17.',
  category: 'Publishing',
  sheetWIn: 16,
  sheetHIn: 21,
  steps: [
    { type: 'booklet', s: { sheetWIn: 17, sheetHIn: 11 } },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: signature('pb-comic-magazine', { cols: 2, rows: 2, crop: true, reg: true, cut: true }),
});
