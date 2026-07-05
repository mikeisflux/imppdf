import { template, grid } from '../kit';

export default template({
  id: 'cp-shingled-3up',
  name: "Shingled 3-Up (Cut & Stack)",
  desc: 'Cut-and-stack imposition for sequentially ordered pieces (8×3.5"), 3 strips.',
  category: 'Commercial Print',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'cutstack', s: { cols: 1, rows: 3, cellWIn: 8, cellHIn: 3.5, sheetWIn: 8.5, sheetHIn: 11, addMarks: true, centerMarks: true } },
  ],
  preview: grid('cp-shingled-3up', 1, 3, { crop: true }),
});
