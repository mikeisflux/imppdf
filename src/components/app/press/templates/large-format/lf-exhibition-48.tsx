import { template, single } from '../kit';

export default template({
  id: 'lf-exhibition-48',
  name: "Exhibition Panel (4×8 ft)",
  desc: '4×8 ft exhibition panel scaled and prepped.',
  category: 'Large Format',
  sheetWIn: 48,
  sheetHIn: 96,
  steps: [
    { type: 'resize', s: { sheetWIn: 48, sheetHIn: 96, addMarks: true, centerMarks: true } },
  ],
  preview: single('lf-exhibition-48', { crop: true }),
});
