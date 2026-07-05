import { template, single } from '../kit';

export default template({
  id: 'of-interleave',
  name: "Interleave Two Documents",
  desc: 'Interleave the pages of two PDFs one after another.',
  category: 'Office',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'mix' },
  ],
  preview: single('of-interleave'),
});
