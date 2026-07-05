import { template, booklet } from '../kit';

export default template({
  id: 'pb-memorial-service',
  name: "Memorial Service Program",
  desc: 'Half-letter bi-fold memorial program. 4 pages — cover, obituary spread, back.',
  category: 'Publishing',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'booklet', s: { addMarks: true } },
  ],
  preview: booklet('pb-memorial-service', { crop: true }),
});
