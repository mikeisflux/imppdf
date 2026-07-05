import { template, grid } from '../kit';

export default template({
  id: 'pk-pouch-2up',
  name: "Pouch Flats (2-Up Tabloid)",
  desc: 'Stand-up pouch flats (6×9") printed 2-up on landscape Tabloid for heat-seal pouches.',
  category: 'Packaging',
  sheetWIn: 11,
  sheetHIn: 17,
  steps: [
    { type: 'grid', s: { cols: 2, rows: 1, cellWIn: 5, cellHIn: 8, sheetWIn: 11, sheetHIn: 17, addMarks: true, centerMarks: true } },
  ],
  preview: grid('pk-pouch-2up', 2, 1, { crop: true }),
});
