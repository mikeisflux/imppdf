import { template, grid } from '../kit';

export default template({
  id: 'cp-2up-rackcards',
  name: "2-Up Rack Cards (4×9\")",
  desc: 'Standard rack cards for brochure holders, 2-up on tabloid stock.',
  category: 'Commercial Print',
  sheetWIn: 11,
  sheetHIn: 17,
  steps: [
    { type: 'grid', s: { cols: 2, rows: 1, cellWIn: 4, cellHIn: 9, sheetWIn: 11, sheetHIn: 17, addMarks: true, centerMarks: true } },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: grid('cp-2up-rackcards', 2, 1, { crop: true, reg: true, cut: true }),
});
