import { template, booklet } from '../kit';

export default template({
  id: 'pb-trade-32pg',
  name: "Trade Paperback 32-Page (Spine + Signatures)",
  desc: '32-page trade paperback with spine allowance, gathering and collating marks.',
  category: 'Publishing',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'booklet', s: { signatureSheets: 4 } },
    { type: 'gathering' },
    { type: 'collating' },
  ],
  preview: booklet('pb-trade-32pg', { saddle: false }),
});
