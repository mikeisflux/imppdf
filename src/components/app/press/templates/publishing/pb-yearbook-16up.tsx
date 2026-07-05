import { template, booklet } from '../kit';

export default template({
  id: 'pb-yearbook-16up',
  name: "Yearbook Signatures (16-Up)",
  desc: 'Yearbook signatures imposed 16-up for perfect binding.',
  category: 'Publishing',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'nupbook', s: { cols: 4, rows: 4 } },
  ],
  preview: booklet('pb-yearbook-16up'),
});
