import { template, single } from '../kit';

export default template({
  id: 'of-rotate-landscape',
  name: "Rotate All Pages Landscape",
  desc: 'Rotates all pages 90° clockwise. Useful for converting portrait scans to landscape.',
  category: 'Office',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'rotate', s: { angleDeg: 90 } },
  ],
  preview: single('of-rotate-landscape'),
});
