import { template, grid } from '../kit';

export default template({
  id: 'cp-postcard-wt',
  name: "Postcard 2-Up (Work & Turn)",
  desc: '2-up work-and-turn postcard (6×4") imposition; flip along the short edge.',
  category: 'Commercial Print',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'grid', s: { cols: 1, rows: 2, cellWIn: 6, cellHIn: 4, duplex: true, duplexFlip: 'long', sheetWIn: 8.5, sheetHIn: 11, addMarks: true, centerMarks: true } },
  ],
  preview: grid('cp-postcard-wt', 1, 2, { crop: true }),
});
