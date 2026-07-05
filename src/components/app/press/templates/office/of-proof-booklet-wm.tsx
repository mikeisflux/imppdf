import { template, booklet } from '../kit';

export default template({
  id: 'of-proof-booklet-wm',
  name: "Proof Booklet with Watermark",
  desc: 'Saddle-stitch booklet on Letter with a PROOF watermark — for client review copies.',
  category: 'Office',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'booklet', s: { addMarks: true } },
    { type: 'watermark', s: { text: 'PROOF' } },
  ],
  preview: booklet('of-proof-booklet-wm', { crop: true, watermark: 'PROOF' }),
});
