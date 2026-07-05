import { template, grid } from '../kit';

export default template({
  id: 'cp-gatefold',
  name: "Gatefold Brochure (4-Panel, Letter)",
  desc: '4-panel gatefold marketing brochure on Letter landscape. Two inner panels fold inward to meet at center.',
  category: 'Commercial Print',
  sheetWIn: 11,
  sheetHIn: 8.5,
  steps: [
    { type: 'grid', s: { cols: 1, rows: 1, cellWIn: 11, cellHIn: 8.5, sheetWIn: 11, sheetHIn: 8.5, addMarks: true, centerMarks: true } },
    { type: 'foldmarks', s: { scheme: 'gate' } },
  ],
  preview: grid('cp-gatefold', 1, 1, { crop: true }),
});
