import { template, booklet } from '../kit';

export default template({
  id: 'pb-32page-sig-8up',
  name: "32-Page Book Signature (8-Up)",
  desc: '32-page book signatures 8-up with gathering and collating marks.',
  category: 'Publishing',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'booklet', s: { signatureSheets: 4 } },
    { type: 'gathering' },
    { type: 'collating' },
  ],
  preview: booklet('pb-32page-sig-8up', { saddle: false }),
});
