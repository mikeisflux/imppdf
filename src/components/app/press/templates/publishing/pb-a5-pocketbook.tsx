import { template, booklet } from '../kit';

export default template({
  id: 'pb-a5-pocketbook',
  name: "A5 Pocket Book",
  desc: 'A5 (148×210mm) pocket paperback using saddle-stitch binding on A4 landscape.',
  category: 'Publishing',
  sheetWIn: 11.69,
  sheetHIn: 8.27,
  steps: [
    { type: 'booklet', s: { sheetWIn: 11.69, sheetHIn: 8.27 } },
  ],
  preview: booklet('pb-a5-pocketbook'),
});
