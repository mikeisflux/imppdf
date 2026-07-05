import { template, zine } from '../kit';

export default template({
  id: 'pb-zine-8pg',
  name: "One-Sheet 8-Page Zine",
  desc: 'Single-sheet 8-page zine — print duplex, cut, and fold.',
  category: 'Publishing',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'zine' },
  ],
  preview: zine('pb-zine-8pg'),
});
