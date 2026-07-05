import { template, single } from '../kit';

export default template({
  id: 'of-add-pagenums',
  name: "Add Page Numbers",
  desc: 'Adds "Page X of Y" to every page. Simple and universal — works with any PDF.',
  category: 'Office',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'pagenumbers' },
  ],
  preview: single('of-add-pagenums'),
});
