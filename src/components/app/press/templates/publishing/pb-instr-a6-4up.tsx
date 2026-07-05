import { template, booklet } from '../kit';

export default template({
  id: 'pb-instr-a6-4up',
  name: "Instruction Booklet (A6 4-Up)",
  desc: 'Small product instruction booklet. 4-up nested on A4 for cost-effective production.',
  category: 'Publishing',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'nupbook', s: { cols: 2, rows: 2 } },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: booklet('pb-instr-a6-4up', { reg: true, cut: true }),
});
