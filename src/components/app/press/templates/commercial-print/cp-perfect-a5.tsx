import { template, booklet } from '../kit';

export default template({
  id: 'cp-perfect-a5',
  name: "Perfect Bound A5 Signatures",
  desc: '4-up perfect-bound book signatures for A5 trade paperbacks on A4 landscape.',
  category: 'Commercial Print',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'booklet', s: { signatureSheets: 4, addMarks: true } },
    { type: 'collating' },
  ],
  preview: booklet('cp-perfect-a5', { crop: true, saddle: false }),
});
