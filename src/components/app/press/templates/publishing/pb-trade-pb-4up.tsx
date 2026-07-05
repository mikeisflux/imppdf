import { template, booklet } from '../kit';

export default template({
  id: 'pb-trade-pb-4up',
  name: "Perfect Bound Trade Paperback (4-Up)",
  desc: '4-up signatures for A5 perfect-bound trade paperbacks. Standard for novels, manuals, and catalogs.',
  category: 'Publishing',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'booklet', s: { signatureSheets: 4 } },
    { type: 'collating' },
  ],
  preview: booklet('pb-trade-pb-4up', { saddle: false }),
});
