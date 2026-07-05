import { template, booklet } from '../kit';

export default template({
  id: 'pb-coloring-book',
  name: "Coloring Book (Letter)",
  desc: 'US Letter coloring book with saddle-stitch binding. Single-sided interior (back pages blank).',
  category: 'Publishing',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'booklet', s: { sheetWIn: 11, sheetHIn: 8.5 } },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: booklet('pb-coloring-book', { reg: true, cut: true }),
});
