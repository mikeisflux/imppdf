import { template, sizedGrid } from '../kit';

// 2-Up Rack Cards (4×9") — two narrow 4×9 rack cards side by side on tabloid,
// drawn at true scale so the tall/narrow proportion reads correctly.
// Reference: catalog.ts t007.
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
  preview: sizedGrid('cp-2up-rackcards', { cols: 2, rows: 1, cellWIn: 4, cellHIn: 9, sheetWIn: 11, sheetHIn: 17 }, { crop: true, reg: true, cut: true }),
});
