import { template, single } from '../kit';

export default template({
  id: 'of-confidential-wm',
  name: "Confidential Watermark",
  desc: 'Red CONFIDENTIAL watermark for sensitive documents — visible but non-destructive.',
  category: 'Office',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'watermark', s: { text: 'CONFIDENTIAL' } },
  ],
  preview: single('of-confidential-wm', { watermark: 'CONFIDENTIAL' }),
});
