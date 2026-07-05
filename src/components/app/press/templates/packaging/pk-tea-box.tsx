import { template, grid } from '../kit';

export default template({
  id: 'pk-tea-box',
  name: "Tea Box Wrap",
  desc: 'Tea carton wrap flat (7×9") with cut contour for die-cutting.',
  category: 'Packaging',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'grid', s: { cols: 1, rows: 1, cellWIn: 7, cellHIn: 9, sheetWIn: 8.5, sheetHIn: 11, addMarks: true, centerMarks: true } },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: grid('pk-tea-box', 1, 1, { crop: true, reg: true, cut: true }),
});
