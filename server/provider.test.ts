import assert from 'node:assert/strict';
import test from 'node:test';
import { UpstreamError, isRemediationResult, parseModelJson } from './provider.js';

const VALID = {
  originalText: 'Some text',
  formulas: [{ description: 'desc', latex: 'E = mc^2', mathml: '<math></math>' }],
};

test('parses a clean JSON reply', () => {
  const result = parseModelJson(JSON.stringify(VALID), 'Test');
  assert.equal(result.originalText, 'Some text');
  assert.equal(result.formulas.length, 1);
});

test('recovers JSON from a markdown code fence', () => {
  // Local models wrap the object in ```json despite the schema being enforced.
  const raw = '```json\n' + JSON.stringify(VALID) + '\n```';
  assert.equal(parseModelJson(raw, 'Test').formulas.length, 1);
});

test('recovers JSON from an unlabelled code fence', () => {
  const raw = '```\n' + JSON.stringify(VALID) + '\n```';
  assert.equal(parseModelJson(raw, 'Test').formulas.length, 1);
});

test('recovers JSON wrapped in prose', () => {
  const raw = `Here is the extracted data:\n${JSON.stringify(VALID)}\nLet me know if you need more.`;
  assert.equal(parseModelJson(raw, 'Test').originalText, 'Some text');
});

test('normalizes unicode maths in the recovered latex', () => {
  const raw = JSON.stringify({
    originalText: '',
    formulas: [{ description: 'd', latex: 'x = ±√2', mathml: '<math></math>' }],
  });
  assert.equal(parseModelJson(raw, 'Test').formulas[0].latex, 'x = \\pm \\sqrt{2}');
});

test('rejects empty output', () => {
  assert.throws(() => parseModelJson('', 'Test'), (error: UpstreamError) => {
    assert.equal(error.status, 502);
    assert.match(error.message, /returned no content/);
    return true;
  });
  assert.throws(() => parseModelJson(undefined, 'Test'), /returned no content/);
  assert.throws(() => parseModelJson('   ', 'Test'), /returned no content/);
});

test('rejects unparseable output', () => {
  assert.throws(() => parseModelJson('I could not read the image.', 'Test'), /unexpected shape/);
});

test('rejects JSON of the wrong shape', () => {
  assert.throws(() => parseModelJson('{"foo":1}', 'Test'), /unexpected shape/);
  assert.throws(
    () => parseModelJson('{"originalText":"x","formulas":"not an array"}', 'Test'),
    /unexpected shape/,
  );
  assert.throws(
    () => parseModelJson('{"originalText":"x","formulas":[{"latex":"a"}]}', 'Test'),
    /unexpected shape/,
    'a formula missing description and mathml must be rejected',
  );
});

test('names the provider in the error so logs say which backend failed', () => {
  assert.throws(() => parseModelJson('nonsense', 'Ollama'), /^UpstreamError: Ollama/);
});

test('isRemediationResult guards each field', () => {
  assert.equal(isRemediationResult(VALID), true);
  assert.equal(isRemediationResult(null), false);
  assert.equal(isRemediationResult('string'), false);
  assert.equal(isRemediationResult({ originalText: 1, formulas: [] }), false);
  assert.equal(isRemediationResult({ originalText: '', formulas: [{}] }), false);
  assert.equal(isRemediationResult({ originalText: '', formulas: [] }), true);
});
