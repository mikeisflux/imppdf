import { template, grid } from '../kit';

export default template({
  id: 'pk-candle-wraps',
  name: "Candle Wraps (4-Up)",
  desc: 'Candle label wraps (3×8") printed 4-up on Tabloid for wrapping round candles.',
  category: 'Packaging',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'grid', s: { cols: 1, rows: 4, cellWIn: 8, cellHIn: 2.5, sheetWIn: 8.5, sheetHIn: 11, addMarks: true, centerMarks: true } },
  ],
  preview: grid('pk-candle-wraps', 1, 4, { crop: true }),
});
