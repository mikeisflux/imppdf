import { template, booklet } from '../kit';

export default template({
  id: 'cp-fullbleed-brochure',
  name: "Full-Bleed Brochure Booklet",
  desc: 'Add 3mm bleed to brochure pages, then impose as saddle-stitch booklet on Tabloid.',
  category: 'Commercial Print',
  sheetWIn: 11,
  sheetHIn: 17,
  steps: [
    { type: 'bleed', s: { bleedIn: 0.125 } },
    { type: 'booklet', s: { sheetWIn: 11, sheetHIn: 17, addMarks: true } },
  ],
  preview: booklet('cp-fullbleed-brochure', { crop: true }),
});
