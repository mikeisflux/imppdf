import { template, booklet } from '../kit';

export default template({
  id: 'pb-playbill',
  name: "Playbill / Theater Program",
  desc: 'A5 saddle-stitched theater program booklet on A4 stock.',
  category: 'Publishing',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'booklet', s: { addMarks: true } },
  ],
  preview: booklet('pb-playbill', { crop: true }),
});
