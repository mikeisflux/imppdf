import { template, sizedGrid } from '../kit';

export default template({
  id: 'cp-certificate-2up',
  name: "Certificate 2-Up",
  desc: 'Award or training certificates 2-up on tabloid for desktop proofing or short-run printing.',
  category: 'Commercial Print',
  sheetWIn: 11,
  sheetHIn: 17,
  steps: [
    { type: 'grid', s: { cols: 1, rows: 2, cellWIn: 11, cellHIn: 8.5, sheetWIn: 11, sheetHIn: 17, addMarks: true, centerMarks: true } },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: sizedGrid('cp-certificate-2up', { cols: 1, rows: 2, cellWIn: 11, cellHIn: 8.5, sheetWIn: 11, sheetHIn: 17 }, { crop: true, reg: true, cut: true }),
});
