import { template, booklet } from '../kit';

export default template({
  id: 'pb-pocket-digest',
  name: "Pocket Digest (5×8\")",
  desc: '5×8" digest-size booklet using perfect binding. Common for literary journals and anthologies.',
  category: 'Publishing',
  sheetWIn: 8,
  sheetHIn: 10,
  steps: [
    { type: 'booklet', s: { sheetWIn: 10, sheetHIn: 8 } },
  ],
  preview: booklet('pb-pocket-digest'),
});
