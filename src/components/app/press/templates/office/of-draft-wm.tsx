import { template, single } from '../kit';

export default template({
  id: 'of-draft-wm',
  name: "Draft Watermark",
  desc: 'Stamp a diagonal DRAFT watermark on every page — prevents accidental use of unfinished documents.',
  category: 'Office',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'watermark', s: { text: 'DRAFT' } },
  ],
  preview: single('of-draft-wm', { watermark: 'DRAFT' }),
});
