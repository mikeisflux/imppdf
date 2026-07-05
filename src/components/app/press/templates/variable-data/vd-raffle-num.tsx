import { template, grid } from '../kit';

export default template({
  id: 'vd-raffle-num',
  name: "Raffle Tickets (Numbered)",
  desc: 'Code 128 barcode raffle tickets from CSV, 4-up on Letter.',
  category: 'Variable Data',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'datamerge', s: { cols: 2, rows: 4, cellWIn: 4, cellHIn: 2, sheetWIn: 8.5, sheetHIn: 11, addMarks: true, centerMarks: true } },
    { type: 'barcode', s: { symbology: 'code128' } },
  ],
  preview: grid('vd-raffle-num', 2, 4, { crop: true }),
});
