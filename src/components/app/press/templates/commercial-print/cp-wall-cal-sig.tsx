import { template, single } from '../kit';

export default template({
  id: 'cp-wall-cal-sig',
  name: "Wall Calendar Signatures",
  desc: 'Coil-bound wall calendar with back cover rotation on tabloid landscape.',
  category: 'Commercial Print',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'calendar', s: { addMarks: true } },
    { type: 'booklet' },
  ],
  preview: single('cp-wall-cal-sig', { crop: true }),
});
