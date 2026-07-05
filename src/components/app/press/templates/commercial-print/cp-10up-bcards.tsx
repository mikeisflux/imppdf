import { template, sizedGrid } from '../kit';

// 10-Up Business Cards — standard US 3.5×2" cards, 2 across × 5 down on Letter,
// with 1/8" bleed and crop marks. Reference: catalog.ts t000.
export default template({
  id: 'cp-10up-bcards',
  name: '10-Up Business Cards',
  desc: "Standard US business cards (3.5×2\") ganged 10-up on Letter with bleeds and crop marks.",
  category: 'Commercial Print',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'grid', s: { cols: 2, rows: 5, cellWIn: 3.5, cellHIn: 2, sheetWIn: 8.5, sheetHIn: 11, bleedMode: 'fixed', bleedIn: 0.125, addMarks: true, centerMarks: true } },
  ],
  // 2×5 gang of distinct cards with crop ticks at every corner.
  preview: sizedGrid('cp-10up-bcards', { cols: 2, rows: 5, cellWIn: 3.5, cellHIn: 2, sheetWIn: 8.5, sheetHIn: 11 }, { crop: true }),
});
