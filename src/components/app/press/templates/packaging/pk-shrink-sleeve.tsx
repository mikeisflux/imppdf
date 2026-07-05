import { template, single } from '../kit';

export default template({
  id: 'pk-shrink-sleeve',
  name: "Shrink Sleeve (Roll)",
  desc: 'Shrink sleeve at pre-shrink dimensions with distortion compensation.',
  category: 'Packaging',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'distort' },
  ],
  preview: single('pk-shrink-sleeve'),
});
