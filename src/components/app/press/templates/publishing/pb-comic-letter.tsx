import { template, bookSheet } from '../kit';

// Comic Book (Letter) — saddle-stitched 8.5×11" single-issue comic, imposed
// 2-up on 11×17 with trim marks.
export default template({
  id: 'pb-comic-letter',
  name: 'Comic Book (Letter)',
  desc: 'Saddle-stitched Letter (8.5×11") single-issue comic, imposed 2-up on 11×17.',
  category: 'Publishing',
  sheetWIn: 17,
  sheetHIn: 11,
  steps: [
    { type: 'comic', s: { sheetWIn: 17, sheetHIn: 11, centerOutput: true } },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: bookSheet('pb-comic-letter', { trimWIn: 8.5, trimHIn: 11, sheetWIn: 17, sheetHIn: 11 }, { saddle: true, crop: true, reg: true, cut: true }),
});
