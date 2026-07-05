import { template, grid } from '../kit';

export default template({
  id: 're-brochure-trifold',
  name: "Property Brochure Tri-Fold 2-Up",
  desc: 'Property tri-fold brochures (11×8.5") 2-up on Tabloid with fold marks.',
  category: 'Real Estate',
  sheetWIn: 11,
  sheetHIn: 17,
  steps: [
    { type: 'grid', s: { cols: 1, rows: 2, cellWIn: 11, cellHIn: 8.5, sheetWIn: 11, sheetHIn: 17, addMarks: true, centerMarks: true } },
    { type: 'foldmarks', s: { scheme: 'trifold' } },
  ],
  preview: grid('re-brochure-trifold', 1, 2, { crop: true }),
});
