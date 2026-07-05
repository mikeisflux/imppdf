import { template, sizedGrid } from '../kit';

export default template({
  id: 'cp-tearoff-flyer',
  name: "Tear-Off Flyer with Tabs",
  desc: 'Flyer (8.5×11") with a row of tear-off contact tabs along the bottom.',
  category: 'Commercial Print',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'grid', s: { cols: 1, rows: 1, cellWIn: 8.5, cellHIn: 11, sheetWIn: 8.5, sheetHIn: 11, addMarks: true, centerMarks: true } },
  ],
  preview: sizedGrid('cp-tearoff-flyer', { cols: 1, rows: 1, cellWIn: 8.5, cellHIn: 11, sheetWIn: 8.5, sheetHIn: 11 }, { crop: true }),
});
