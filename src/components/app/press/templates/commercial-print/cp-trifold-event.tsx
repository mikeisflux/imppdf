import { template, sizedGrid } from '../kit';

export default template({
  id: 'cp-trifold-event',
  name: "Tri-Fold Event Program",
  desc: 'Tri-fold event or church program on Letter landscape. 6 panels with fold marks.',
  category: 'Commercial Print',
  sheetWIn: 11,
  sheetHIn: 8.5,
  steps: [
    { type: 'grid', s: { cols: 1, rows: 1, cellWIn: 11, cellHIn: 8.5, sheetWIn: 11, sheetHIn: 8.5, addMarks: true, centerMarks: true } },
    { type: 'foldmarks', s: { scheme: 'trifold' } },
  ],
  preview: sizedGrid('cp-trifold-event', { cols: 1, rows: 1, cellWIn: 11, cellHIn: 8.5, sheetWIn: 11, sheetHIn: 8.5 }, { crop: true }),
});
