import { template, grid } from '../kit';

export default template({
  id: 'cp-work-turn-gang',
  name: "Work-and-Turn Gang Sheet",
  desc: 'Work-and-turn duplex sheet (4-up) flipped along the long edge.',
  category: 'Commercial Print',
  sheetWIn: 11,
  sheetHIn: 17,
  steps: [
    { type: 'grid', s: { cols: 2, rows: 2, cellWIn: 5, cellHIn: 8, duplex: true, duplexFlip: 'long', sheetWIn: 11, sheetHIn: 17, addMarks: true, centerMarks: true } },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: grid('cp-work-turn-gang', 2, 2, { crop: true, reg: true, cut: true }),
});
