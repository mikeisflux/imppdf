import { template, single } from '../kit';

export default template({
  id: 'pb-desk-cal-tent',
  name: "Desk Calendar (Tent Style)",
  desc: 'Desk tent calendar on Letter landscape with half-sheet layout.',
  category: 'Publishing',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'calendar' },
  ],
  preview: single('pb-desk-cal-tent'),
});
