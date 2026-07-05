import { template, booklet } from '../kit';

export default template({
  id: 'cp-saddle-a4-mag',
  name: "Saddle-Stitch A4 Magazine",
  desc: '32-page A4 magazine signatures on A3 landscape sheets for commercial offset.',
  category: 'Commercial Print',
  sheetWIn: 11.69,
  sheetHIn: 16.54,
  steps: [
    { type: 'booklet', s: { signatureSheets: 4, sheetWIn: 16.54, sheetHIn: 11.69, addMarks: true } },
    { type: 'colorbar' },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: booklet('cp-saddle-a4-mag', { crop: true, reg: true, cut: true, colorbar: true, saddle: false }),
});
