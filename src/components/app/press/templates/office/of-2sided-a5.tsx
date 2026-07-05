import { template, grid } from '../kit';

export default template({
  id: 'of-2sided-a5',
  name: "2-Sided A5 Flyer",
  desc: 'Quick double-sided A5 flyer from your desktop printer. No marks, no bleeds — just fold or cut.',
  category: 'Office',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'grid', s: { cols: 1, rows: 2, cellWIn: 8, cellHIn: 5.3, duplex: true, sheetWIn: 8.5, sheetHIn: 11, addMarks: true, centerMarks: true } },
  ],
  preview: grid('of-2sided-a5', 1, 2, { crop: true }),
});
