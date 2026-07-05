import { template, sizedGrid } from '../kit';

export default template({
  id: 'cp-folder-insert',
  name: "Folder Insert (Tabloid)",
  desc: 'Presentation folder insert (9×12") centered on tabloid with trim marks.',
  category: 'Commercial Print',
  sheetWIn: 11,
  sheetHIn: 17,
  steps: [
    { type: 'grid', s: { cols: 1, rows: 1, cellWIn: 9, cellHIn: 12, sheetWIn: 11, sheetHIn: 17, addMarks: true, centerMarks: true } },
  ],
  preview: sizedGrid('cp-folder-insert', { cols: 1, rows: 1, cellWIn: 9, cellHIn: 12, sheetWIn: 11, sheetHIn: 17 }, { crop: true }),
});
