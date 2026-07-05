import { template, booklet } from '../kit';

export default template({
  id: 'pb-newsletter-4pg',
  name: "Newsletter 4-Page (Single Fold)",
  desc: 'Simple 4-page newsletter — one sheet folded in half on Letter landscape.',
  category: 'Publishing',
  sheetWIn: 11,
  sheetHIn: 17,
  steps: [
    { type: 'booklet', s: { sheetWIn: 11, sheetHIn: 17 } },
  ],
  preview: booklet('pb-newsletter-4pg'),
});
