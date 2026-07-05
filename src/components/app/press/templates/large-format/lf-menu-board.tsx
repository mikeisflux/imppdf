import { template, single } from '../kit';

export default template({
  id: 'lf-menu-board',
  name: "Menu Board (Tabloid)",
  desc: 'Restaurant menu board at 11×17" Tabloid with color bar for print verification.',
  category: 'Large Format',
  sheetWIn: 11,
  sheetHIn: 17,
  steps: [
    { type: 'resize', s: { sheetWIn: 11, sheetHIn: 17, addMarks: true, centerMarks: true } },
  ],
  preview: single('lf-menu-board', { crop: true }),
});
