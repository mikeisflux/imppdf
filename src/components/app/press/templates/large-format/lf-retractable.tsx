import { template, single } from '../kit';

export default template({
  id: 'lf-retractable',
  name: "Retractable Banner (33×80\")",
  desc: 'Standard retractable/roll-up banner at 33×80" for trade shows and events.',
  category: 'Large Format',
  sheetWIn: 33,
  sheetHIn: 80,
  steps: [
    { type: 'resize', s: { sheetWIn: 33, sheetHIn: 80, addMarks: true, centerMarks: true } },
  ],
  preview: single('lf-retractable', { crop: true }),
});
