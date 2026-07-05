import { template, grid } from '../kit';

export default template({
  id: 'lf-tradeshow',
  name: "Trade Show Display Graphics",
  desc: 'Exhibition pop-up display panels on 48×96" wide-format with color bar for proofing.',
  category: 'Large Format',
  sheetWIn: 96,
  sheetHIn: 96,
  steps: [
    { type: 'grid', s: { cols: 3, rows: 1, cellWIn: 30, cellHIn: 90, sheetWIn: 96, sheetHIn: 96, addMarks: true, centerMarks: true } },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: grid('lf-tradeshow', 3, 1, { crop: true, reg: true, cut: true }),
});
