import { template, booklet } from '../kit';

export default template({
  id: 'pb-photo-book-a4',
  name: "Photo Book (Landscape A4)",
  desc: 'Landscape A4 photo book with perfect binding. Full-bleed photo spreads.',
  category: 'Publishing',
  sheetWIn: 16.54,
  sheetHIn: 11.69,
  steps: [
    { type: 'booklet', s: { sheetWIn: 16.54, sheetHIn: 11.69 } },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: booklet('pb-photo-book-a4', { reg: true, cut: true }),
});
