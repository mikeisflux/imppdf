import { template, bookSheet } from '../kit';

// Comic Book (Magazine) — saddle-stitched 8×10.5" single-issue comic, imposed
// 2-up on 11×17 with trim marks.
export default template({
  id: 'pb-comic-magazine',
  name: 'Comic Book (Magazine)',
  desc: 'Saddle-stitched Magazine (8×10.5") single-issue comic, imposed 2-up on 11×17.',
  category: 'Publishing',
  sheetWIn: 17,
  sheetHIn: 11,
  steps: [
    { type: 'comic', s: { sheetWIn: 17, sheetHIn: 11, centerOutput: true } },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: bookSheet('pb-comic-magazine', { trimWIn: 8, trimHIn: 10.5, sheetWIn: 17, sheetHIn: 11 }, { saddle: true, crop: true, reg: true, cut: true }),
});
