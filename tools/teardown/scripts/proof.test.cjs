const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const proof = require('./proof.cjs');

const CONFIG = path.resolve(__dirname, '../../../drawing/drawing.json');

function withTempDir(run) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'proof-test-'));
  try {
    return run(dir);
  } finally {
    fs.rmSync(dir, {recursive: true, force: true});
  }
}

test('quick proof without PNGs writes assembled + exploded sheets for every drawing', () => {
  withTempDir(dir => {
    const {files, warnings} = proof(CONFIG, dir, {png: false, quick: true});
    assert.deepEqual(files.map(file => path.basename(file)), ['scope-default-assembled.svg', 'scope-default-exploded.svg', 'tip-default-assembled.svg', 'tip-default-exploded.svg']);
    assert.deepEqual(warnings, []);
    assert.ok(files.every(file => fs.existsSync(file)));
  });
});

test('--only keeps one drawing', () => {
  withTempDir(dir => {
    const {files} = proof(CONFIG, dir, {png: false, quick: true, only: 'tip'});
    assert.deepEqual(files.map(file => path.basename(file)), ['tip-default-assembled.svg', 'tip-default-exploded.svg']);
  });
});

test('unknown drawing, unknown view and crop without a rasterizer are refused', () => {
  withTempDir(dir => {
    assert.throws(() => proof(CONFIG, dir, {png: false, only: 'nope'}), /No drawing with id nope/);
    assert.throws(() => proof(CONFIG, dir, {png: false, view: 'bogus'}), /View must be assembled, exploded or spread/);
    assert.throws(() => proof(CONFIG, dir, {png: false, crop: [0, 0, 10, 10]}), /Crops need an SVG rasterizer/);
  });
});
