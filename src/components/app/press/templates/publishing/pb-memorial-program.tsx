import { template, booklet } from '../kit';

export default template({
  id: 'pb-memorial-program',
  name: "Memorial / Funeral Program",
  desc: 'Half-letter memorial program, saddle-stitched on Letter landscape. Single fold, 4-8 pages.',
  category: 'Publishing',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'booklet', s: { addMarks: true } },
  ],
  preview: booklet('pb-memorial-program', { crop: true }),
});
