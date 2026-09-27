import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import test from 'node:test';
import { DEMO_SAMPLE } from './demo-sample.js';
import { enrichFormulas } from './shared/enrich.js';

test('the demo sample image ships with the build', () => {
  assert.ok(existsSync(`public/${DEMO_SAMPLE.image}`), `missing public/${DEMO_SAMPLE.image}`);
});

test('every recorded formula converts and gets spoken', async () => {
  const formulas = await enrichFormulas([...DEMO_SAMPLE.latex]);
  assert.ok(formulas.length > 0);
  for (const formula of formulas) {
    assert.equal(formula.needsReview, false, `did not convert: ${formula.latex}`);
    assert.ok(formula.description, `no speech for: ${formula.latex}`);
  }
});

test('the recorded counts are consistent', () => {
  assert.ok(DEMO_SAMPLE.latex.length <= DEMO_SAMPLE.formulasOnPage);
  assert.ok(DEMO_SAMPLE.runs >= 1);
});
