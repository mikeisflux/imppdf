import { template, grid } from '../kit';

export default template({
  id: 'pk-cd-jewel-wrap',
  name: "CD/DVD Jewel Case Wrap",
  desc: 'Optical disc jewel case wrap (9.5×4.72") on Tabloid with trim marks.',
  category: 'Packaging',
  sheetWIn: 11,
  sheetHIn: 17,
  steps: [
    { type: 'grid', s: { cols: 1, rows: 2, cellWIn: 9.5, cellHIn: 4.75, sheetWIn: 11, sheetHIn: 17, addMarks: true, centerMarks: true } },
    { type: 'foldmarks', s: { scheme: 'custom' } },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: grid('pk-cd-jewel-wrap', 1, 2, { crop: true, reg: true, cut: true }),
});
