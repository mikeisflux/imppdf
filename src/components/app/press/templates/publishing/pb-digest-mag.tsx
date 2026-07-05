import { template, booklet } from '../kit';

export default template({
  id: 'pb-digest-mag',
  name: "Digest Magazine (5.5×8.5\")",
  desc: 'Reader\'s Digest-size magazine signatures. 4-up saddle-stitch on Tabloid.',
  category: 'Publishing',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'booklet', s: { sheetWIn: 8.5, sheetHIn: 11 } },
    { type: 'colorbar' },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: booklet('pb-digest-mag', { reg: true, cut: true, colorbar: true }),
});
