import { template, sizedGrid } from '../kit';

export default template({
  id: 'of-mailing-5160',
  name: "Mailing Labels (Avery 5160 Style)",
  desc: 'Address labels nested on Letter. Compatible with Avery 5160 and similar 30-up label sheets.',
  category: 'Office',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'grid', s: { cols: 3, rows: 10, cellWIn: 2.625, cellHIn: 1, sheetWIn: 8.5, sheetHIn: 11, addMarks: true } },
  ],
  preview: sizedGrid('of-mailing-5160', { cols: 3, rows: 10, cellWIn: 2.625, cellHIn: 1, sheetWIn: 8.5, sheetHIn: 11 }, { crop: true }),
});
