import { template, sizedGrid } from '../kit';

export default template({
  id: 'of-halfsheet-2up',
  name: "Half-Sheet Handout 2-Up",
  desc: 'Two half-letter handouts per sheet. Perfect for meeting agendas, sign-up sheets, and flyers.',
  category: 'Office',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'grid', s: { cols: 1, rows: 2, cellWIn: 8.5, cellHIn: 5.5, sheetWIn: 8.5, sheetHIn: 11, addMarks: true, centerMarks: true } },
  ],
  preview: sizedGrid('of-halfsheet-2up', { cols: 1, rows: 2, cellWIn: 8.5, cellHIn: 5.5, sheetWIn: 8.5, sheetHIn: 11 }, { crop: true }),
});
