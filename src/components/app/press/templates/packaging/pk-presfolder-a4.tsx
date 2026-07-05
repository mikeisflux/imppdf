import { template, grid } from '../kit';

export default template({
  id: 'pk-presfolder-a4',
  name: "Presentation Folder Dieline (A4 Pocket)",
  desc: 'A4 presentation folder (8×11") with pocket, glue tabs and die lines.',
  category: 'Packaging',
  sheetWIn: 8.27,
  sheetHIn: 11.69,
  steps: [
    { type: 'grid', s: { cols: 1, rows: 1, cellWIn: 8, cellHIn: 11, sheetWIn: 8.27, sheetHIn: 11.69, addMarks: true, centerMarks: true } },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: grid('pk-presfolder-a4', 1, 1, { crop: true, reg: true, cut: true }),
});
