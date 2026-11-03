const test = require('node:test'), assert = require('node:assert'), fs = require('node:fs'), path = require('node:path');
const {clipIssues} = require('./clips.cjs');
const study = require('./study.json');

const credit = {work: 'w', part: 'p', url: 'u', copyright: 'c', license: 'l', licenseUrl: 'lu'};

test('real clip set passes + balances', function real() {
  assert.deepStrictEqual(clipIssues(study.clips, study.levels.length), []);
});

test('every open clip has its file', function files() {
  const open = study.clips.filter(function isOpen(c) { return c.source === 'open'; });
  for (const c of open) assert.ok(fs.existsSync(path.join(__dirname, 'open', c.name + '.mp4')), c.name);
});

test('label without quote fails', function noQuote() {
  assert.ok(clipIssues([{id: 'a', truth: {lesion: 'Yes'}, credit}], 1).some(function quote(i) { return i.includes('truthQuote'); }));
});

test('clip with no label needs no quote', function noLabel() {
  assert.deepStrictEqual(clipIssues([{id: 'a', truth: {}, credit}], 1), []);
});

test('duplicate id, bad count, missing credit fail', function bad() {
  const a = {id: 'a', truth: {}, credit};
  assert.ok(clipIssues([a, a], 1)[0].includes('duplicate'));
  assert.ok(clipIssues([a], 2)[0].includes('multiple'));
  assert.ok(clipIssues([{id: 'b', truth: {}, credit: {}}], 1).length);
});
