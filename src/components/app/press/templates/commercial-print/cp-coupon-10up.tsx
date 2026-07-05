import { template, grid } from '../kit';

export default template({
  id: 'cp-coupon-10up',
  name: "Coupon Sheets (10-Up)",
  desc: '3.5×2" coupons ganged 10-up on Letter with perforation-ready marks.',
  category: 'Commercial Print',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'grid', s: { cols: 2, rows: 5, cellWIn: 3.5, cellHIn: 2, sheetWIn: 8.5, sheetHIn: 11, addMarks: true, centerMarks: true } },
  ],
  preview: grid('cp-coupon-10up', 2, 5, { crop: true }),
});
