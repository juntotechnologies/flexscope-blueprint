// Pure pass rule for the survey: each level vs the best level, with a bootstrap over raters + patients so repeats by 1 rater or 1 patient don't count as independent.
const CANT_TELL = "Can't tell";

function mulberry32(seed) {
  let a = seed;
  return function next() {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// One mark per labelled question per trial.
function trialMarks(row, clip, questions) {
  const labelled = questions.filter(function known(q) { return q.scored && q.id in clip.truth; });
  return labelled.map(function mark(q) {
    return {session: row.session, patient: clip.patient, level: row.level, correct: row[q.id] === clip.truth[q.id] ? 1 : 0, cantTell: row[q.id] === CANT_TELL ? 1 : 0};
  });
}

function drawCounts(items, random) {
  const counts = new Map(items.map(function zero(i) { return [i, 0]; }));
  for (let n = 0; n < items.length; n++) {
    const pick = items[Math.floor(random() * items.length)];
    counts.set(pick, counts.get(pick) + 1);
  }
  return counts;
}

function weightedAccuracy(marks, weight) {
  let right = 0, total = 0;
  for (const m of marks) {
    const w = weight(m);
    right += w * m.correct;
    total += w;
  }
  return total ? right / total : NaN;
}

function plainAccuracy(marks) {
  return weightedAccuracy(marks, function one() { return 1; });
}

function unique(marks, key) {
  return [...new Set(marks.map(function value(m) { return m[key]; }))];
}

function oneDraw(byLevel, sessions, patients, random) {
  const s = drawCounts(sessions, random), p = drawCounts(patients, random);
  function weight(m) { return s.get(m.session) * p.get(m.patient); }
  return Object.fromEntries(Object.entries(byLevel).map(function score(entry) { return [entry[0], weightedAccuracy(entry[1], weight)]; }));
}

function percentile(sorted, q) {
  return sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
}

// 95% interval of (level − best), in fraction points. Draws with no data for a level are dropped.
function differenceIntervals(marks, levelIds, bestId, runs, seed) {
  const random = mulberry32(seed);
  const byLevel = Object.fromEntries(levelIds.map(function group(id) { return [id, marks.filter(function m(x) { return x.level === id; })]; }));
  const sessions = unique(marks, 'session'), patients = unique(marks, 'patient');
  const diffs = Object.fromEntries(levelIds.map(function empty(id) { return [id, []]; }));
  for (let r = 0; r < runs; r++) {
    const scores = oneDraw(byLevel, sessions, patients, random);
    for (const id of levelIds) {
      const d = scores[id] - scores[bestId];
      if (Number.isFinite(d)) diffs[id].push(d);
    }
  }
  return Object.fromEntries(levelIds.map(function bounds(id) {
    const sorted = diffs[id].sort(function asc(a, b) { return a - b; });
    return [id, {lower: percentile(sorted, 0.025), upper: percentile(sorted, 0.975)}];
  }));
}

function mean(values) {
  return values.length ? values.reduce(function sum(a, b) { return a + b; }, 0) / values.length : NaN;
}

function usableMean(rows, roles) {
  const entRows = rows.filter(function ent(r) { return roles.includes(r.role); });
  return mean(entRows.map(function score(r) { return parseInt(r.usable, 10); }).filter(Number.isFinite));
}

function bestLevel(stats) {
  return stats.reduce(function better(a, b) { return b.accuracy > a.accuracy ? b : a; }).id;
}

function levelPasses(stat, rule) {
  return stat.lower >= -rule.marginPoints / 100 && stat.usable >= rule.usableMin;
}

function floorDetected(stat, rule) {
  return stat.upper < 0 || stat.usable <= rule.floorUsableMax;
}

function cameraResult(camera, levelStats, rule) {
  const own = levelStats.filter(function mine(s) { return s.camera === camera.id; });
  const clean = own.filter(function noAssumption(s) { return !s.assumption; });
  const poorLight = own.filter(function assumed(s) { return s.assumption; });
  return {camera, passes: clean.length > 0 && clean.every(function pass(s) { return levelPasses(s, rule); }),
    poorLightPasses: poorLight.every(function pass(s) { return levelPasses(s, rule); })};
}

function goodResult(result) {
  const note = result.poorLightPasses ? 'passes, poor-light level too' : 'passes in good light only: fix light/lens before changing sensor';
  return {verdict: 'bench-test', camera: result.camera.id, part: result.camera.part, rankUsd: result.camera.rankUsd, note};
}

function verdict(levelStats, cameras, rule, raterCount) {
  if (raterCount < rule.minRaters) return {verdict: 'not enough data', note: `${raterCount} of ${rule.minRaters} raters`};
  const floor = levelStats.find(function isFloor(s) { return s.camera === null; });
  if (!floorDetected(floor, rule)) return {verdict: 'test void', note: 'floor level not clearly worse: test cannot detect loss'};
  const ranked = [...cameras].sort(function cheap(a, b) { return a.rankUsd - b.rankUsd; });
  const results = ranked.map(function result(c) { return cameraResult(c, levelStats, rule); });
  const winner = results.find(function pass(r) { return r.passes; });
  return winner ? goodResult(winner) : {verdict: 'no camera passes', note: 'no tested part met the rule'};
}

module.exports = {trialMarks, plainAccuracy, differenceIntervals, usableMean, bestLevel, levelPasses, floorDetected, verdict, mulberry32};
