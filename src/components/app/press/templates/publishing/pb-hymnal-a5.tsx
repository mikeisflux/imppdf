import { template, booklet } from '../kit';

export default template({
  id: 'pb-hymnal-a5',
  name: "Hymnal / Songbook (A5)",
  desc: 'A5 hymnal or songbook with perfect binding on A4 stock. For churches and choirs.',
  category: 'Publishing',
  sheetWIn: 11.69,
  sheetHIn: 8.27,
  steps: [
    { type: 'booklet', s: { sheetWIn: 11.69, sheetHIn: 8.27 } },
  ],
  preview: booklet('pb-hymnal-a5'),
});
