import { template, single } from '../kit';

export default template({
  id: 'lf-re-signs-2436',
  name: "Real Estate Signs (24×36\")",
  desc: 'Large real estate signs at 24×36" for property listings and open house signage.',
  category: 'Large Format',
  sheetWIn: 24,
  sheetHIn: 36,
  steps: [
    { type: 'resize', s: { sheetWIn: 24, sheetHIn: 36, addMarks: true, centerMarks: true } },
  ],
  preview: single('lf-re-signs-2436', { crop: true }),
});
