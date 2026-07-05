import { template, sizedGrid } from '../kit';

export default template({
  id: 'cp-cd-tray-2up',
  name: "CD Tray Card 2-Up",
  desc: 'Standard CD jewel case tray cards (4.75×4.75") ganged 2-up on Letter.',
  category: 'Commercial Print',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'grid', s: { cols: 1, rows: 2, cellWIn: 5.9, cellHIn: 4.6, sheetWIn: 8.5, sheetHIn: 11, addMarks: true, centerMarks: true } },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: sizedGrid('cp-cd-tray-2up', { cols: 1, rows: 2, cellWIn: 5.9, cellHIn: 4.6, sheetWIn: 8.5, sheetHIn: 11 }, { crop: true, reg: true, cut: true }),
});
