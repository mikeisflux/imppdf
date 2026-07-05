import { template, sizedGrid } from '../kit';

export default template({
  id: 'of-certs-2',
  name: "Certificates (2-Up)",
  desc: 'Half-letter classroom certificates printed 2-up on Letter for quick teacher printing.',
  category: 'Office',
  sheetWIn: 11,
  sheetHIn: 17,
  steps: [
    { type: 'grid', s: { cols: 1, rows: 2, cellWIn: 11, cellHIn: 8.5, sheetWIn: 11, sheetHIn: 17, addMarks: true, centerMarks: true } },
  ],
  preview: sizedGrid('of-certs-2', { cols: 1, rows: 2, cellWIn: 11, cellHIn: 8.5, sheetWIn: 11, sheetHIn: 17 }, { crop: true }),
});
