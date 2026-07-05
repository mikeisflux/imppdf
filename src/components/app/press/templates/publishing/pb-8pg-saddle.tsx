import { template, booklet } from '../kit';

export default template({
  id: 'pb-8pg-saddle',
  name: "8-Page Saddle-Stitch Booklet",
  desc: 'Simple 8-page saddle-stitch booklet.',
  category: 'Publishing',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'booklet', s: { addMarks: true } },
  ],
  preview: booklet('pb-8pg-saddle', { crop: true }),
});
