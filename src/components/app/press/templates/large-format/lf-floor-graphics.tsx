import { template, single } from '../kit';

export default template({
  id: 'lf-floor-graphics',
  name: "Floor Graphics (24×24\")",
  desc: 'Square floor decals at 24×24" for retail wayfinding and promotional graphics.',
  category: 'Large Format',
  sheetWIn: 24,
  sheetHIn: 24,
  steps: [
    { type: 'resize', s: { sheetWIn: 24, sheetHIn: 24, addMarks: true, centerMarks: true } },
  ],
  preview: single('lf-floor-graphics', { crop: true }),
});
