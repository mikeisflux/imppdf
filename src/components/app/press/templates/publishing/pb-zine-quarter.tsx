import { template, zine } from '../kit';

export default template({
  id: 'pb-zine-quarter',
  name: "Quarter-Letter Zine",
  desc: 'Micro-zine at 4.25×5.5" using 4-up saddle-stitch on Letter. Cut, fold, staple.',
  category: 'Publishing',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'zine' },
  ],
  preview: zine('pb-zine-quarter'),
});
