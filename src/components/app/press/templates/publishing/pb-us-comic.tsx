import { template, booklet } from '../kit';

export default template({
  id: 'pb-us-comic',
  name: "US Comic Book (6.625×10.25\")",
  desc: 'Standard US comic book format on Tabloid with saddle-stitch binding.',
  category: 'Publishing',
  sheetWIn: 10.25,
  sheetHIn: 13.25,
  steps: [
    { type: 'booklet', s: { sheetWIn: 13.25, sheetHIn: 10.25 } },
    { type: 'colorbar' },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: booklet('pb-us-comic', { reg: true, cut: true, colorbar: true }),
});
