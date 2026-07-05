import { template, booklet } from '../kit';

export default template({
  id: 'cp-bifold-menu',
  name: "Bi-Fold Restaurant Menu",
  desc: 'Standard bi-fold menu on Tabloid. Print both sides, fold in half for 4-panel menu.',
  category: 'Commercial Print',
  sheetWIn: 11,
  sheetHIn: 17,
  steps: [
    { type: 'booklet', s: { sheetWIn: 11, sheetHIn: 17, addMarks: true } },
  ],
  preview: booklet('cp-bifold-menu', { crop: true }),
});
