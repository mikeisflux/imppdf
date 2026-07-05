import { template, sizedGrid } from '../kit';

export default template({
  id: 'cp-2up-giftcert',
  name: "2-Up Gift Certificates (5×7\")",
  desc: '5×7" gift certificates, 2-up on Letter stock with crop marks.',
  category: 'Commercial Print',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'grid', s: { cols: 1, rows: 2, cellWIn: 7, cellHIn: 5, sheetWIn: 8.5, sheetHIn: 11, addMarks: true, centerMarks: true } },
  ],
  preview: sizedGrid('cp-2up-giftcert', { cols: 1, rows: 2, cellWIn: 7, cellHIn: 5, sheetWIn: 8.5, sheetHIn: 11 }, { crop: true }),
});
