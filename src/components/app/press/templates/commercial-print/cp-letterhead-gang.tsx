import { template, sizedGrid } from '../kit';

export default template({
  id: 'cp-letterhead-gang',
  name: "Letterhead Gang Run",
  desc: 'Multiple letterhead jobs (8.5×11") ganged 2-up on tabloid with press marks.',
  category: 'Commercial Print',
  sheetWIn: 11,
  sheetHIn: 17,
  steps: [
    { type: 'grid', s: { cols: 1, rows: 2, cellWIn: 11, cellHIn: 8.5, sheetWIn: 11, sheetHIn: 17, addMarks: true, centerMarks: true } },
    { type: 'colorbar' },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: sizedGrid('cp-letterhead-gang', { cols: 1, rows: 2, cellWIn: 11, cellHIn: 8.5, sheetWIn: 11, sheetHIn: 17 }, { crop: true, reg: true, cut: true, colorbar: true }),
});
