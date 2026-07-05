import { template, single } from '../kit';

export default template({
  id: 'lf-window-clings-a3',
  name: "Window Clings (A3)",
  desc: 'A3 (297×420mm) window cling graphics for storefront and vehicle windows.',
  category: 'Large Format',
  sheetWIn: 11.69,
  sheetHIn: 16.54,
  steps: [
    { type: 'resize', s: { sheetWIn: 11.69, sheetHIn: 16.54, addMarks: true, centerMarks: true } },
  ],
  preview: single('lf-window-clings-a3', { crop: true }),
});
