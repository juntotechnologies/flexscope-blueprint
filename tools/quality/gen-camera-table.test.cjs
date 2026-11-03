const test = require('node:test'), assert = require('node:assert');
const {issues, render} = require('./gen-camera-table.cjs');
const data = require('./cameras.json');

test('real table has every required field', function realData() {
  assert.deepStrictEqual(issues(data.cameras), []);
});

test('row without a source or with unknown class fails', function badRows() {
  const good = data.cameras[0];
  assert.ok(issues([{...good, source: ''}]).length);
  assert.ok(issues([{...good, class: 'vibes'}]).length);
});

test('render replaces only the block', function replace() {
  const text = 'a\n<!-- cameras:begin -->\nold\n<!-- cameras:end -->\nb';
  const out = render(text, data);
  assert.ok(out.startsWith('a\n') && out.endsWith('b') && !out.includes('old') && out.includes('OV9734'));
});

test('dollar amounts survive replacement', function dollars() {
  const out = render('<!-- cameras:begin -->\n<!-- cameras:end -->', data);
  assert.ok(out.includes('$17.43'));
});

test('missing markers throw', function missing() {
  assert.throws(function run() { render('no markers', data); });
});
