import { template, grid } from '../kit';

export default template({
  id: 'cp-ncr-3part',
  name: "NCR Form (3-Part Carbon)",
  desc: '3-part carbonless form on Letter. Each part prints on separate sheet for collating.',
  category: 'Commercial Print',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'grid', s: { cols: 1, rows: 1, cellWIn: 8.5, cellHIn: 11, sheetWIn: 8.5, sheetHIn: 11, addMarks: true, centerMarks: true } },
  ],
  preview: grid('cp-ncr-3part', 1, 1, { crop: true }),
});
