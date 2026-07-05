import { template, signature } from '../kit';

// Comic Book (Letter) — saddle-stitched 8.5×11" single-issue comic, imposed
// 2-up on 11×17 with trim marks.
export default template({
  id: 'pb-comic-letter',
  name: 'Comic Book (Letter)',
  desc: 'Saddle-stitched Letter (8.5×11") single-issue comic, imposed 2-up on 11×17.',
  category: 'Publishing',
  sheetWIn: 17,
  sheetHIn: 22,
  steps: [
    { type: 'booklet', s: { sheetWIn: 17, sheetHIn: 11 } },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: signature('pb-comic-letter', { cols: 2, rows: 2, crop: true, reg: true, cut: true }),
});
