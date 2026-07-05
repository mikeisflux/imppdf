import { template, sizedGrid } from '../kit';

export default template({
  id: 'cp-3up-num-tickets',
  name: "3-Up Numbered Tickets",
  desc: 'Sequentially numbered raffle tickets (8×3.5"), 3-up with cut-and-stack ordering.',
  category: 'Commercial Print',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'datamerge' },
    { type: 'shuffle' },
    { type: 'grid', s: { cols: 1, rows: 3, cellWIn: 8, cellHIn: 3.5, sheetWIn: 8.5, sheetHIn: 11, addMarks: true, centerMarks: true } },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: sizedGrid('cp-3up-num-tickets', { cols: 1, rows: 3, cellWIn: 8, cellHIn: 3.5, sheetWIn: 8.5, sheetHIn: 11 }, { crop: true, reg: true, cut: true, numbered: true }),
});
