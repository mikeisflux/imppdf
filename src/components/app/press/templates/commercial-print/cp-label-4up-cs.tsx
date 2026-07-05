import { template, sizedGrid } from '../kit';

export default template({
  id: 'cp-label-4up-cs',
  name: "Label 4-Up (Cut & Stack)",
  desc: 'Product labels (4×5") 4-up with cut-and-stack ordering for guillotining.',
  category: 'Commercial Print',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'cutstack', s: { cols: 2, rows: 2, cellWIn: 4, cellHIn: 5, sheetWIn: 8.5, sheetHIn: 11, addMarks: true, centerMarks: true } },
  ],
  preview: sizedGrid('cp-label-4up-cs', { cols: 2, rows: 2, cellWIn: 4, cellHIn: 5, sheetWIn: 8.5, sheetHIn: 11 }, { crop: true }),
});
