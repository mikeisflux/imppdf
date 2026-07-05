import { template, booklet } from '../kit';

export default template({
  id: 'pb-a5-sra3',
  name: "A5 Saddle-Stitch 2-Up on SRA3",
  desc: 'Commercial A5 saddle-stitch workflow: impose each booklet side on SRA4, then repeat two copies on SRA3.',
  category: 'Publishing',
  sheetWIn: 12.6,
  sheetHIn: 8.86,
  steps: [
    { type: 'booklet', s: { sheetWIn: 12.6, sheetHIn: 8.86 } },
    { type: 'grid', s: { cols: 2, rows: 1, sheetWIn: 12.6, sheetHIn: 17.72 } },
  ],
  preview: booklet('pb-a5-sra3'),
});
