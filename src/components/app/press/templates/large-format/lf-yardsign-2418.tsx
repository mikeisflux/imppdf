import { template, single } from '../kit';

export default template({
  id: 'lf-yardsign-2418',
  name: "Yard Sign (24×18\")",
  desc: 'Standard coroplast yard sign at 24×18" landscape for real estate, political, and event signage.',
  category: 'Large Format',
  sheetWIn: 24,
  sheetHIn: 18,
  steps: [
    { type: 'resize', s: { sheetWIn: 24, sheetHIn: 18, addMarks: true, centerMarks: true } },
  ],
  preview: single('lf-yardsign-2418', { crop: true }),
});
