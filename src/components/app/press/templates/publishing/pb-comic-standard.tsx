import { template, bookSheet } from '../kit';

// Comic Book (Standard) — saddle-stitched 6.625×10.25" single-issue comic,
// imposed 2-up on 11×17 with trim marks.
export default template({
  id: 'pb-comic-standard',
  name: 'Comic Book (Standard)',
  desc: 'Saddle-stitched Standard (6.625×10.25") single-issue comic, imposed 2-up on 11×17.',
  category: 'Publishing',
  sheetWIn: 17,
  sheetHIn: 11,
  steps: [
    { type: 'comic', s: { sheetWIn: 17, sheetHIn: 11, centerOutput: true } },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: bookSheet('pb-comic-standard', { trimWIn: 6.625, trimHIn: 10.25, sheetWIn: 17, sheetHIn: 11 }, { saddle: true, crop: true, reg: true, cut: true }),
});
