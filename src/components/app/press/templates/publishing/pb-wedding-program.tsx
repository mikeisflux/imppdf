import { template, booklet } from '../kit';

export default template({
  id: 'pb-wedding-program',
  name: "Wedding Program",
  desc: 'Half-letter (5.5×8.5") wedding program booklet, saddle-stitched on Letter landscape.',
  category: 'Publishing',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'booklet', s: { addMarks: true } },
  ],
  preview: booklet('pb-wedding-program', { crop: true }),
});
