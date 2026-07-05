import { template, sizedGrid } from '../kit';

export default template({
  id: 'cp-photo-contact-8',
  name: "Photo Contact Sheet (8-Up)",
  desc: 'Photographer\'s proof sheet with 8 images (2×4) on Letter. Quick client review layout.',
  category: 'Commercial Print',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'grid', s: { cols: 2, rows: 4, cellWIn: 3.75, cellHIn: 2.4, sheetWIn: 8.5, sheetHIn: 11, addMarks: true, centerMarks: true } },
  ],
  preview: sizedGrid('cp-photo-contact-8', { cols: 2, rows: 4, cellWIn: 3.75, cellHIn: 2.4, sheetWIn: 8.5, sheetHIn: 11 }, { crop: true }),
});
