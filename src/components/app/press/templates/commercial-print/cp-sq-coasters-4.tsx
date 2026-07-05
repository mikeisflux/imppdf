import { template, sizedGrid } from '../kit';

export default template({
  id: 'cp-sq-coasters-4',
  name: "Square Coasters (4-Up)",
  desc: '4" square drink coasters printed 4-up on Tabloid stock with crop marks for die cutting.',
  category: 'Commercial Print',
  sheetWIn: 11,
  sheetHIn: 17,
  steps: [
    { type: 'grid', s: { cols: 2, rows: 2, cellWIn: 4, cellHIn: 4, sheetWIn: 11, sheetHIn: 17, addMarks: true, centerMarks: true } },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: sizedGrid('cp-sq-coasters-4', { cols: 2, rows: 2, cellWIn: 4, cellHIn: 4, sheetWIn: 11, sheetHIn: 17 }, { crop: true, reg: true, cut: true }),
});
