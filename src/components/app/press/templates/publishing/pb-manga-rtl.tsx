import { template, booklet } from '../kit';

export default template({
  id: 'pb-manga-rtl',
  name: "Manga / RTL Comic Booklet",
  desc: 'Right-to-left saddle-stitched booklet for manga, Arabic, and Hebrew comics on B5 landscape.',
  category: 'Publishing',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'booklet', s: { rtl: true } },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: booklet('pb-manga-rtl', { reg: true, cut: true }),
});
