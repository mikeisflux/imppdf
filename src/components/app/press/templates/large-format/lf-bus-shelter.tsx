import { template, single } from '../kit';

export default template({
  id: 'lf-bus-shelter',
  name: "Bus Shelter Poster (46×67\")",
  desc: 'Standard bus shelter/transit advertising poster at 46×67" for backlit display.',
  category: 'Large Format',
  sheetWIn: 46,
  sheetHIn: 67,
  steps: [
    { type: 'resize', s: { sheetWIn: 46, sheetHIn: 67, addMarks: true, centerMarks: true } },
  ],
  preview: single('lf-bus-shelter', { crop: true }),
});
