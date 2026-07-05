import { template, grid } from '../kit';

export default template({
  id: 'pk-pizza-lid',
  name: "Pizza Box Lid (13×19\")",
  desc: '10×10" pizza box lid flat, 1-up on 13×19" stock with trim marks (10″ square cannot fit 2-up).',
  category: 'Packaging',
  sheetWIn: 13,
  sheetHIn: 19,
  steps: [
    { type: 'grid', s: { cols: 1, rows: 1, cellWIn: 12, cellHIn: 18, sheetWIn: 13, sheetHIn: 19, addMarks: true, centerMarks: true } },
    { type: 'foldmarks', s: { scheme: 'custom' } },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: grid('pk-pizza-lid', 1, 1, { crop: true, reg: true, cut: true }),
});
