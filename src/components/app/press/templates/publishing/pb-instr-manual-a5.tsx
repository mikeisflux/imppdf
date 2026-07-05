import { template, booklet } from '../kit';

export default template({
  id: 'pb-instr-manual-a5',
  name: "Instruction Manual (A5)",
  desc: 'A5 product instruction booklet, saddle-stitched on A4. Compact format for product packaging.',
  category: 'Publishing',
  sheetWIn: 11.69,
  sheetHIn: 8.27,
  steps: [
    { type: 'booklet', s: { sheetWIn: 11.69, sheetHIn: 8.27 } },
  ],
  preview: booklet('pb-instr-manual-a5'),
});
