import { template, booklet } from '../kit';

export default template({
  id: 'pb-student-planner',
  name: "Student Planner (4-Up)",
  desc: 'A6 student planner pages imposed 4-up on A4 for perfect binding. 52+ weeks.',
  category: 'Publishing',
  sheetWIn: 8.5,
  sheetHIn: 11,
  steps: [
    { type: 'nupbook', s: { cols: 2, rows: 2 } },
  ],
  preview: booklet('pb-student-planner'),
});
