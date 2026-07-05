import { template, single } from '../kit';

export default template({
  id: 'lf-feather-flag',
  name: "Feather Flag (Soft Signage)",
  desc: 'Feather-flag soft-signage panel scaled to the flag profile.',
  category: 'Large Format',
  sheetWIn: 30,
  sheetHIn: 100,
  steps: [
    { type: 'resize', s: { sheetWIn: 30, sheetHIn: 100, addMarks: true, centerMarks: true } },
  ],
  preview: single('lf-feather-flag', { crop: true }),
});
