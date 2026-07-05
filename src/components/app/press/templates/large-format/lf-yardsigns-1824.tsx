import { template, single } from '../kit';

export default template({
  id: 'lf-yardsigns-1824',
  name: "Yard Signs (18×24\")",
  desc: 'Corrugated yard signs at 18×24" for real estate, political campaigns, and event signage.',
  category: 'Large Format',
  sheetWIn: 18,
  sheetHIn: 24,
  steps: [
    { type: 'resize', s: { sheetWIn: 18, sheetHIn: 24, addMarks: true, centerMarks: true } },
  ],
  preview: single('lf-yardsigns-1824', { crop: true }),
});
