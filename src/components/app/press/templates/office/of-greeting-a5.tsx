import { template, booklet } from '../kit';

export default template({
  id: 'of-greeting-a5',
  name: "Greeting Card (A5 Fold)",
  desc: 'Single-fold greeting card on Letter landscape. Print, fold in half, done.',
  category: 'Office',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'booklet', s: { addMarks: true } },
  ],
  preview: booklet('of-greeting-a5', { crop: true }),
});
