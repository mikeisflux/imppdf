import { template, grid } from '../kit';

export default template({
  id: 'cp-2up-doorhangers',
  name: "2-Up Door Hangers",
  desc: 'Standard door hangers (3.875×8.75") ganged 2-up on Letter with trim marks.',
  category: 'Commercial Print',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'grid', s: { cols: 1, rows: 2, cellWIn: 3.875, cellHIn: 8.75, sheetWIn: 8.5, sheetHIn: 11, addMarks: true, centerMarks: true } },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: grid('cp-2up-doorhangers', 1, 2, { crop: true, reg: true, cut: true }),
});
