import { template, zine } from '../kit';

export default template({
  id: 'of-mini-a7-zine',
  name: "Mini Booklet (A7 Zine)",
  desc: 'DIY mini zine using 4-up saddle-stitch on A4. Cut, fold, staple — instant pocket booklet.',
  category: 'Office',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'zine' },
  ],
  preview: zine('of-mini-a7-zine'),
});
