import assert from 'node:assert/strict';
import test from 'node:test';
import { latexToMathml } from './latex-to-mathml.js';
import { renderAccessible } from './speech.js';

test('speaks a fraction the way a person reads it aloud', async () => {
  // Both rule sets special-case vulgar fractions: "one half", not
  // "StartFraction one Over two EndFraction". Where they diverge is structure,
  // which the quadratic-formula test below covers.
  const { clearspeak } = await renderAccessible(latexToMathml('\\frac{1}{2}'));
  assert.equal(clearspeak, 'one half');
});

test('ClearSpeak and MathSpeak differ in how they mark structure', async () => {
  const mathml = latexToMathml('x = \\frac{-b \\pm \\sqrt{b^{2} - 4ac}}{2a}');
  const { clearspeak, mathspeak } = await renderAccessible(mathml);

  // MathSpeak brackets structure explicitly; ClearSpeak does not.
  assert.match(mathspeak, /StartFraction/);
  assert.doesNotMatch(clearspeak, /StartFraction/);
  assert.match(clearspeak, /square root/i);
});

test('emits Nemeth braille as braille patterns', async () => {
  const { braille } = await renderAccessible(latexToMathml('x^{2}'));
  assert.ok(braille.length > 0, 'expected braille output');
  // Unicode braille patterns live in U+2800–U+28FF.
  assert.match(braille, /[⠀-⣿]/);
});

test('is deterministic across runs', async () => {
  const mathml = latexToMathml('a^{2} + b^{2} = c^{2}');
  const first = await renderAccessible(mathml);
  const second = await renderAccessible(mathml);
  assert.deepEqual(first, second);
});

test('concurrent callers do not read each other’s engine configuration', async () => {
  // SRE's engine is a process-wide singleton reconfigured per call, so an
  // unserialized implementation returns braille where speech was asked for.
  const inputs = ['x + 1', '\\frac{a}{b}', '\\sqrt{2}', 'y^{3}'];
  const results = await Promise.all(
    inputs.map(async (latex) => renderAccessible(latexToMathml(latex))),
  );

  for (const result of results) {
    assert.doesNotMatch(result.clearspeak, /[⠀-⣿]/, 'speech contains braille');
    assert.match(result.braille, /[⠀-⣿]/);
  }
});
