import { template, booklet } from '../kit';

export default template({
  id: 'pb-16pg-perfect',
  name: "16-Page Signature (Perfect Bind)",
  desc: '16-page signature imposed for perfect binding.',
  category: 'Publishing',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'nupbook' },
  ],
  preview: booklet('pb-16pg-perfect'),
});
