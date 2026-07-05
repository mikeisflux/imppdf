import { template, booklet } from '../kit';

export default template({
  id: 'cp-saddle-a5',
  name: "Saddle-Stitch A5 Booklet",
  desc: 'Creates print-ready A5 saddle-stitched booklets from A5 source pages on A4 landscape sheets.',
  category: 'Commercial Print',
  sheetWIn: 11.69,
  sheetHIn: 8.27,
  steps: [
    { type: 'booklet', s: { sheetWIn: 11.69, sheetHIn: 8.27, addMarks: true } },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: booklet('cp-saddle-a5', { crop: true, reg: true, cut: true }),
});
