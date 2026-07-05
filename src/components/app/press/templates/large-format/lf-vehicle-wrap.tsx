import { template, sizedGrid } from '../kit';

export default template({
  id: 'lf-vehicle-wrap',
  name: "Vehicle Wrap Panel Layout",
  desc: 'Vehicle wrap split into overlapping panels for application.',
  category: 'Large Format',
  sheetWIn: 60,
  sheetHIn: 60,
  steps: [
    { type: 'grid', s: { cols: 3, rows: 2, cellWIn: 20, cellHIn: 30, sheetWIn: 60, sheetHIn: 60, addMarks: true, centerMarks: true } },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: sizedGrid('lf-vehicle-wrap', { cols: 3, rows: 2, cellWIn: 20, cellHIn: 30, sheetWIn: 60, sheetHIn: 60 }, { crop: true, reg: true, cut: true }),
});
