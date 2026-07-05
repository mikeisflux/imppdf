import { template, sizedGrid } from '../kit';

export default template({
  id: 'pk-lp-sleeve',
  name: "LP Record Sleeve Insert",
  desc: '12×12" vinyl record sleeve insert, 1-up on 13×19" stock (12″ square cannot fit 2-up on a 13×19″ sheet).',
  category: 'Packaging',
  sheetWIn: 13,
  sheetHIn: 19,
  steps: [
    { type: 'grid', s: { cols: 1, rows: 1, cellWIn: 12, cellHIn: 12, sheetWIn: 13, sheetHIn: 19, addMarks: true, centerMarks: true } },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: sizedGrid('pk-lp-sleeve', { cols: 1, rows: 1, cellWIn: 12, cellHIn: 12, sheetWIn: 13, sheetHIn: 19 }, { crop: true, reg: true, cut: true }),
});
