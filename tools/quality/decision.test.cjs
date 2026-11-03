const test = require('node:test'), assert = require('node:assert');
const {entOnly, trialMarks, plainAccuracy, differenceIntervals, usableMean, bestLevel, levelPasses, floorDetected, verdict} = require('./decision.cjs');

const RULE = {marginPoints: 10, usableMin: 4, floorUsableMax: 3, minRaters: 20};
const CAMS = [{id: 'cheap', part: 'Cheap', rankUsd: 40}, {id: 'dear', part: 'Dear', rankUsd: 370}];
const QUESTIONS = [{id: 'lesion', scored: true}, {id: 'mobility', scored: true}, {id: 'usable', scored: false}];

function stat(id, camera, lower, upper, usable, assumption) {
  return {id, camera, lower, upper, usable, accuracy: 1 + lower, assumption};
}

const FLOOR = {...stat('floor', 'dear', -0.5, -0.3, 2, 'guess'), floor: true};

test('marks only labelled questions; can\'t tell is wrong + counted', function marks() {
  const out = trialMarks({session: 's', level: 'a', lesion: "Can't tell", mobility: 'Both move'}, {patient: 'p', truth: {lesion: 'Yes'}}, QUESTIONS);
  assert.deepStrictEqual(out, [{session: 's', patient: 'p', level: 'a', correct: 0, cantTell: 1}]);
});

test('clip with no label gives no marks', function none() {
  assert.deepStrictEqual(trialMarks({session: 's', level: 'a'}, {patient: 'p', truth: {}}, QUESTIONS), []);
});

test('too few raters: not enough data', function few() {
  assert.strictEqual(verdict([FLOOR], CAMS, RULE, 19).verdict, 'not enough data');
});

test('floor not worse: test void', function voidTest() {
  assert.strictEqual(verdict([{...stat('floor', 'dear', -0.05, 0.02, 4.5, 'guess'), floor: true}], CAMS, RULE, 20).verdict, 'test void');
});

test('cheapest passing camera wins', function cheapest() {
  const out = verdict([stat('a', 'cheap', -0.02, 0.01, 4.5), stat('b', 'dear', -0.01, 0, 4.6), FLOOR], CAMS, RULE, 20);
  assert.strictEqual(out.camera, 'cheap');
  assert.ok(out.note.includes('poor-light level too'));
});

test('cheap camera fails on interval: next camera', function fallsThrough() {
  const out = verdict([stat('a', 'cheap', -0.2, 0, 4.5), stat('b', 'dear', -0.01, 0, 4.6), FLOOR], CAMS, RULE, 20);
  assert.strictEqual(out.camera, 'dear');
});

test('cheap camera fails on usable: next camera', function usableFail() {
  const out = verdict([stat('a', 'cheap', -0.01, 0, 3.9), stat('b', 'dear', -0.01, 0, 4.6), FLOOR], CAMS, RULE, 20);
  assert.strictEqual(out.camera, 'dear');
});

test('poor-light fail keeps camera, says fix light', function poorLight() {
  const out = verdict([stat('a', 'cheap', -0.01, 0, 4.5), stat('n', 'cheap', -0.4, -0.2, 2, 'guess'), FLOOR], CAMS, RULE, 20);
  assert.strictEqual(out.camera, 'cheap');
  assert.ok(out.note.includes('fix light'));
});

test('nothing passes', function nonePass() {
  assert.strictEqual(verdict([stat('a', 'cheap', -0.4, 0, 2), FLOOR], CAMS, RULE, 20).verdict, 'no camera passes');
});

test('pass + floor bounds', function bounds() {
  assert.ok(levelPasses({lower: -0.1, usable: 4}, RULE));
  assert.ok(!levelPasses({lower: -0.11, usable: 4}, RULE));
  assert.ok(floorDetected({upper: -0.01, usable: 5}, RULE));
  assert.ok(floorDetected({upper: 0.1, usable: 3}, RULE));
  assert.ok(!floorDetected({upper: 0.1, usable: 3.1}, RULE));
});

test('only named roles count', function roles() {
  const rows = [{role: 'ENT attending', usable: '5 Yes'}, {role: 'Other', usable: '1 No'}];
  assert.deepStrictEqual(entOnly(rows, ['ENT attending']), [rows[0]]);
  assert.strictEqual(usableMean(entOnly(rows, ['ENT attending'])), 5);
});

test('best level + accuracy', function best() {
  assert.strictEqual(bestLevel([{id: 'a', accuracy: 0.5}, {id: 'b', accuracy: 0.9}]), 'b');
  assert.strictEqual(plainAccuracy([{correct: 1}, {correct: 0}]), 0.5);
});

function sample(raters, patients, accuracyByLevel) {
  const marks = [];
  for (let r = 0; r < raters; r++) {
    for (let p = 0; p < patients; p++) {
      for (const [level, accuracy] of Object.entries(accuracyByLevel)) {
        marks.push({session: 'r' + r, patient: 'p' + p, level, correct: (r * 7 + p * 3) % 10 < accuracy * 10 ? 1 : 0, cantTell: 0});
      }
    }
  }
  return marks;
}

test('interval: big gap excludes margin, equal levels include 0, repeatable by seed', function interval() {
  const marks = sample(20, 10, {a: 0.9, b: 0.9, c: 0.3});
  const out = differenceIntervals(marks, ['a', 'b', 'c'], 'a', 500, 1);
  assert.ok(out.c.upper < -0.1);
  assert.ok(out.b.lower <= 0 && out.b.upper >= 0);
  assert.deepStrictEqual(out, differenceIntervals(marks, ['a', 'b', 'c'], 'a', 500, 1));
});

test('repeats are not independent: 1 patient widens interval', function clustered() {
  const many = differenceIntervals(sample(20, 10, {a: 0.9, b: 0.7}), ['a', 'b'], 'a', 500, 2);
  const few = differenceIntervals(sample(4, 2, {a: 0.9, b: 0.7}), ['a', 'b'], 'a', 500, 2);
  assert.ok(few.b.upper - few.b.lower >= many.b.upper - many.b.lower);
});
