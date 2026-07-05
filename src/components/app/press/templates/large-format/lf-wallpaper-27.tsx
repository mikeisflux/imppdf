import { template, single } from '../kit';

export default template({
  id: 'lf-wallpaper-27',
  name: "Wallpaper Panel Repeat (27\")",
  desc: '27"-wide wallpaper panels with a repeating pattern drop.',
  category: 'Large Format',
  sheetWIn: 27,
  sheetHIn: 120,
  steps: [
    { type: 'resize', s: { sheetWIn: 27, sheetHIn: 120, addMarks: true, centerMarks: true } },
  ],
  preview: single('lf-wallpaper-27', { crop: true }),
});
