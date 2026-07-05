import { template, booklet } from '../kit';

export default template({
  id: 'pb-a6-mini-8up',
  name: "Saddle-Stitch A6 Mini Booklet (8-Up)",
  desc: '8-up mini booklet for A6 saddle-stitched inserts and leaflets on A4.',
  category: 'Publishing',
  sheetWIn: 8.27,
  sheetHIn: 11.69,
  steps: [
    { type: 'booklet', s: { sheetWIn: 8.27, sheetHIn: 11.69 } },
    { type: 'foldmarks', s: { scheme: 'half' } },
  ],
  preview: booklet('pb-a6-mini-8up'),
});
