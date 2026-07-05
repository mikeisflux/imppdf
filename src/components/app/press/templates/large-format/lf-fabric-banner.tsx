import { template, single } from '../kit';

export default template({
  id: 'lf-fabric-banner',
  name: "Fabric Banner (24×72\")",
  desc: 'Vertical fabric banner at 24×72" for dye-sublimation printing.',
  category: 'Large Format',
  sheetWIn: 24,
  sheetHIn: 72,
  steps: [
    { type: 'resize', s: { sheetWIn: 24, sheetHIn: 72, addMarks: true, centerMarks: true } },
  ],
  preview: single('lf-fabric-banner', { crop: true }),
});
