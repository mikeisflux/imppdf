import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fitTriFold, trifoldFolds, TRI_FOLD_PANELS } from '../src/lib/imposition-toolkit/fit/tri-folds.ts';
import { fitZFold, zfoldFolds, Z_FOLD_PANELS } from '../src/lib/imposition-toolkit/fit/z-folds.ts';
import { fitGateFold, gatefoldFolds } from '../src/lib/imposition-toolkit/fit/gate-folds.ts';
import { fitMenu, menuFolds } from '../src/lib/imposition-toolkit/fit/menus.ts';

test('folded pieces are ONE item, not one per panel', () => {
  for (const [id, f] of [
    ['trifold', fitTriFold({ sheetWIn: 11, sheetHIn: 8.5 })],
    ['zfold', fitZFold({ sheetWIn: 17, sheetHIn: 11 })],
    ['gatefold', fitGateFold({ sheetWIn: 11, sheetHIn: 8.5 })],
    ['menu', fitMenu({ sheetWIn: 17, sheetHIn: 11 })],
  ] as const) {
    assert.equal(f.n, 1, `${id}: a folded piece ganged is a piece cut apart. ${f.why}`);
    assert.equal(f.rotated, false, `${id}: never turned`);
  }
});

test('fold positions divide the sheet exactly, leaving no sliver', () => {
  const cases: [string, number[], number, number][] = [
    ['trifold', trifoldFolds(11), 11, TRI_FOLD_PANELS],
    ['zfold', zfoldFolds(17), 17, Z_FOLD_PANELS],
    ['gatefold', gatefoldFolds(11), 11, 4],
    ['menu', menuFolds(17), 17, 2],
  ];
  for (const [id, folds, len, panels] of cases) {
    assert.equal(folds.length, panels - 1, `${id}: ${panels} panels need ${panels - 1} folds`);
    // Panels must add back up to the sheet — a rounding slip here shows on press
    // as a fold landing off the artwork.
    const widths = [];
    let prev = 0;
    for (const f of folds) { widths.push(f - prev); prev = f; }
    widths.push(len - prev);
    const total = widths.reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(total - len) < 1e-9, `${id}: panels total ${total}, sheet is ${len}`);
    for (const w of widths) assert.ok(w > 0, `${id}: a panel came out zero-width or negative`);
    // Folds must be in order and inside the sheet.
    for (let i = 0; i < folds.length; i++) {
      assert.ok(folds[i]! > 0 && folds[i]! < len, `${id}: fold ${i} at ${folds[i]} is off the sheet`);
      if (i) assert.ok(folds[i]! > folds[i - 1]!, `${id}: folds out of order`);
    }
  }
});
