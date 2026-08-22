import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fitProofLabels, PROOF_LABEL_COLS, PROOF_LABEL_ROWS } from '../src/lib/imposition-toolkit/fit/proof-labels.ts';

test('proof labels: always the 3×10 die, never a computed grid', () => {
  const f = fitProofLabels({ sheetWIn: 8.5, sheetHIn: 11 }, 2.625, 1);
  assert.equal(f.cols, PROOF_LABEL_COLS);
  assert.equal(f.rows, PROOF_LABEL_ROWS);
  assert.equal(f.n, 30);
  assert.ok(f.fits, f.why);
});

test('proof labels: the die does not change with the sheet — it reports not fitting', () => {
  const f = fitProofLabels({ sheetWIn: 4, sheetHIn: 4 }, 2.625, 1);
  assert.equal(f.n, 30, 'the die is fixed');
  assert.equal(f.fits, false);
  assert.match(f.why, /does not fit/);
});
