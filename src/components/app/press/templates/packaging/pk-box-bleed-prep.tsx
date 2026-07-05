import { template, single } from '../kit';

export default template({
  id: 'pk-box-bleed-prep',
  name: "Box Flat with Bleed Prep",
  desc: 'Add 5mm bleed to a box dieline flat, then resize to fit press sheet — ready for die-cutting.',
  category: 'Packaging',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'bleed', s: { bleedIn: 0.125 } },
    { type: 'cuttermarks', s: { cornersAndEdges: true } },
  ],
  preview: single('pk-box-bleed-prep', { reg: true, cut: true }),
});
