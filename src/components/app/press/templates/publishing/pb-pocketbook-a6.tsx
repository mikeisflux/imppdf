import { template, single } from '../kit';

export default template({
  id: 'pb-pocketbook-a6',
  name: "Pocket Book (A6 from A5)",
  desc: 'Small-format pocket book in A6 with 2-up perfect binding.',
  category: 'Publishing',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'resize' },
    { type: 'booklet' },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: single('pb-pocketbook-a6', { reg: true, cut: true }),
});
