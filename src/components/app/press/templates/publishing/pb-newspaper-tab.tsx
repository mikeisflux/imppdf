import { template, booklet } from '../kit';

export default template({
  id: 'pb-newspaper-tab',
  name: "Newspaper Tabloid Signature",
  desc: 'Tabloid newspaper signature imposition with trim marks.',
  category: 'Publishing',
  sheetWIn: 11,
  sheetHIn: 17,
  steps: [
    { type: 'nupbook', s: { sheetWIn: 11, sheetHIn: 17 } },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: booklet('pb-newspaper-tab', { reg: true, cut: true }),
});
