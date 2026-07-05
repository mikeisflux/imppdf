import { template, single } from '../kit';

export default template({
  id: 'lf-street-pole',
  name: "Street Pole Banner (24×60\")",
  desc: 'Standard street/light pole banner at 24×60" with bleed for pole pocket.',
  category: 'Large Format',
  sheetWIn: 24,
  sheetHIn: 60,
  steps: [
    { type: 'resize', s: { sheetWIn: 24, sheetHIn: 60, addMarks: true, centerMarks: true } },
  ],
  preview: single('lf-street-pole', { crop: true }),
});
