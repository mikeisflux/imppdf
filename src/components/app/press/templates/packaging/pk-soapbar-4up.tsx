import { template, sizedGrid } from '../kit';

export default template({
  id: 'pk-soapbar-4up',
  name: "Soap Bar Wrap 4-Up",
  desc: 'Body care product wraps (3×4") ganged 4-up on Letter.',
  category: 'Packaging',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'grid', s: { cols: 2, rows: 2, cellWIn: 3, cellHIn: 5, sheetWIn: 8.5, sheetHIn: 11, addMarks: true, centerMarks: true } },
    { type: 'foldmarks', s: { scheme: 'custom' } },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: sizedGrid('pk-soapbar-4up', { cols: 2, rows: 2, cellWIn: 3, cellHIn: 5, sheetWIn: 8.5, sheetHIn: 11 }, { crop: true, reg: true, cut: true }),
});
