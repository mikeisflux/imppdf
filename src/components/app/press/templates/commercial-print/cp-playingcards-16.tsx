import { template, sizedGrid } from '../kit';

export default template({
  id: 'cp-playingcards-16',
  name: "Playing Cards 16-Up",
  desc: 'Full deck (2.5×3.5") imposed 16-up on 13×19" with front/back registration.',
  category: 'Commercial Print',
  sheetWIn: 13,
  sheetHIn: 19,
  steps: [
    { type: 'grid', s: { cols: 4, rows: 4, cellWIn: 2.5, cellHIn: 3.5, sheetWIn: 13, sheetHIn: 19, addMarks: true, centerMarks: true } },
    { type: 'regmarks' },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: sizedGrid('cp-playingcards-16', { cols: 4, rows: 4, cellWIn: 2.5, cellHIn: 3.5, sheetWIn: 13, sheetHIn: 19 }, { crop: true, reg: true, cut: true }),
});
