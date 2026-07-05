import { template, booklet } from '../kit';

export default template({
  id: 'pb-layflat-photo',
  name: "Lay-Flat Photo Book (12×12\")",
  desc: 'Square photo album with zero creep for lay-flat binding on 24×12" stock.',
  category: 'Publishing',
  sheetWIn: 12,
  sheetHIn: 24,
  steps: [
    { type: 'booklet', s: { sheetWIn: 24, sheetHIn: 12 } },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: booklet('pb-layflat-photo', { reg: true, cut: true }),
});
