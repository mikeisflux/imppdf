import { template, grid } from '../kit';

export default template({
  id: 'cp-2up-notepad',
  name: "2-Up Notepad Sheets",
  desc: 'Half-letter notepads (5.5×8.5") printed 2-up on Letter (laid landscape) for padding.',
  category: 'Commercial Print',
  sheetWIn: 11,
  sheetHIn: 8.5,
  steps: [
    { type: 'grid', s: { cols: 2, rows: 1, cellWIn: 5.5, cellHIn: 8.5, sheetWIn: 11, sheetHIn: 8.5, addMarks: true, centerMarks: true } },
  ],
  preview: grid('cp-2up-notepad', 2, 1, { crop: true }),
});
