import { template, single } from '../kit';

export default template({
  id: 'pb-landscape-wallcal',
  name: "Landscape Wall Calendar",
  desc: 'Coil-bound wall calendar with back cover rotation on Tabloid landscape.',
  category: 'Publishing',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'calendar' },
    { type: 'booklet' },
  ],
  preview: single('pb-landscape-wallcal'),
});
