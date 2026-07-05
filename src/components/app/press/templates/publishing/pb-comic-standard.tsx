import { template, signature } from '../kit';

// Comic Book (Standard) — saddle-stitched 6.625×10.25" single-issue comic,
// imposed 2-up on 11×17 with trim marks.
export default template({
  id: 'pb-comic-standard',
  name: 'Comic Book (Standard)',
  desc: 'Saddle-stitched Standard (6.625×10.25") single-issue comic, imposed 2-up on 11×17.',
  category: 'Publishing',
  sheetWIn: 13.25,
  sheetHIn: 20.5,
  steps: [
    { type: 'booklet', s: { sheetWIn: 17, sheetHIn: 11 } },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: signature('pb-comic-standard', { cols: 2, rows: 2, crop: true, reg: true, cut: true }),
});
