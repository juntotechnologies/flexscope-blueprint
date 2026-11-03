const test = require('node:test'), assert = require('node:assert');
const {levelIssues, cameraLabel, parseSsim, cropSize, nearPairs} = require('./levels.cjs');
const study = require('./study.json'), {cameras} = require('./cameras.json');

test('real levels name known cameras + 1 floor', function realLevels() {
  assert.deepStrictEqual(levelIssues(study.levels, cameras), []);
});

test('unknown camera + missing floor fail', function badLevels() {
  assert.strictEqual(levelIssues([{id: 'a', camera: 'nope'}], cameras).length, 2);
});

test('label comes from camera table', function label() {
  assert.strictEqual(cameraLabel({camera: null, floor: true}, cameras), 'none: floor');
  assert.strictEqual(cameraLabel({camera: null}, cameras), 'none: probe');
  assert.strictEqual(cameraLabel({camera: cameras[0].id}, cameras), cameras[0].part);
});

test('parses ffmpeg SSIM line', function ssim() {
  assert.strictEqual(parseSsim('[Parsed_ssim_4] SSIM Y:0.9 U:0.9 V:0.9 All:0.912345 (10.5)'), 0.912345);
  assert.throws(function none() { parseSsim('nothing'); });
});

test('crop size reads width or null', function crop() {
  assert.strictEqual(cropSize('516:516:393:100'), 516);
  assert.strictEqual(cropSize(undefined), null);
});

test('flags neighbor levels too close', function near() {
  assert.deepStrictEqual(nearPairs([{level: 'a', ssim: 1}, {level: 'b', ssim: 0.99}, {level: 'c', ssim: 0.8}]), ['a~b']);
});
