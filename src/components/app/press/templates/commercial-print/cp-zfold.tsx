import { template, grid } from '../kit';

export default template({
  id: 'cp-zfold',
  name: "Z-Fold Accordion (6-Panel, Tabloid)",
  desc: '6-panel accordion-style brochure on 11×17" tabloid. Zigzag folds, ~5.67" per panel (17/3).',
  category: 'Commercial Print',
  sheetWIn: 11,
  sheetHIn: 17,
  steps: [
    { type: 'grid', s: { cols: 1, rows: 1, cellWIn: 11, cellHIn: 17, sheetWIn: 11, sheetHIn: 17, addMarks: true, centerMarks: true } },
    { type: 'foldmarks', s: { scheme: 'zfold' } },
  ],
  preview: grid('cp-zfold', 1, 1, { crop: true }),
});
