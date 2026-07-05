import { template, booklet } from '../kit';

export default template({
  id: 'pb-recipe-book',
  name: "Recipe Book (Letter)",
  desc: 'US Letter recipe book with perfect binding. Ideal for cookbooks and recipe collections.',
  category: 'Publishing',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'booklet', s: { sheetWIn: 11, sheetHIn: 8.5 } },
  ],
  preview: booklet('pb-recipe-book'),
});
