#!/usr/bin/env node
// Score answers per quality level (and per setting) from a CSV export of the "responses" sheet.
// Usage: node tools/quality/analyze.cjs responses.csv
const fs = require('node:fs');
const study = require('./study.json'), {cameras} = require('./cameras.json');
const {cameraLabel} = require('./levels.cjs');
const {trialMarks, plainAccuracy, differenceIntervals, usableMean, bestLevel, verdict} = require('./decision.cjs');

// RFC 4180 reader: quoted fields may hold commas, quotes ("") and newlines. One step per char; returns chars used.
function quotedStep(s, text, i) {
  if (text[i] !== '"') { s.field += text[i]; return 1; }
  if (text[i + 1] === '"') { s.field += '"'; return 2; }
  s.quoted = false;
  return 1;
}

function endField(s) {
  s.records.at(-1).push(s.field);
  s.field = '';
}

const PLAIN_STEPS = {
  '"': function openQuote(s) { s.quoted = true; return 1; },
  ',': function comma(s) { endField(s); return 1; },
  '\n': function newline(s) { endField(s); s.records.push([]); return 1; },
  '\r': function carriage(s, text, i) { endField(s); s.records.push([]); return text[i + 1] === '\n' ? 2 : 1; }
};

function plainStep(s, text, i) {
  const step = PLAIN_STEPS[text[i]];
  if (step) return step(s, text, i);
  s.field += text[i];
  return 1;
}

function csvRecords(text) {
  const s = {records: [[]], field: '', quoted: false};
  for (let i = 0; i < text.length;) i += (s.quoted ? quotedStep : plainStep)(s, text, i);
  endField(s);
  return s.records.filter(function nonEmpty(r) { return r.some(Boolean); });
}

function parseCsv(text) {
  const [head, ...lines] = csvRecords(text);
  return lines.map(function row(cells) { return Object.fromEntries(head.map(function pair(h, i) { return [h, cells[i]]; })); });
}

function clipFor(clipId) {
  return study.clips.find(function match(c) { return c.id === clipId; });
}

// A resend after a lost reply repeats a session; keep the first row per session × clip. Drop skipped and unknown clips.
function cleanRows(rows) {
  const seen = new Set();
  return rows.filter(function keep(r) {
    const key = r.session + '|' + r.clip;
    if (seen.has(key) || !clipFor(r.clip) || r.skipped === 'true') return false;
    seen.add(key);
    return true;
  });
}

function score(rows) {
  const scored = study.questions.filter(function s(q) { return q.scored; });
  const stats = {n: rows.length};
  for (const q of scored) {
    const known = rows.filter(function hasTruth(r) { return q.id in clipFor(r.clip).truth; });
    const right = known.filter(function ok(r) { return r[q.id] === clipFor(r.clip).truth[q.id]; }).length;
    stats[q.id + 'Correct'] = known.length ? Math.round(100 * right / known.length) + '%' : '-';
  }
  const usable = rows.map(function u(r) { return parseInt(r.usable, 10); }).filter(Number.isFinite);
  stats.usableMean = usable.length ? (usable.reduce(function sum(a, b) { return a + b; }, 0) / usable.length).toFixed(2) : '-';
  return stats;
}

function table(rows, key) {
  const groups = [...new Set(rows.map(function k(r) { return r[key]; }))];
  return study.levels.flatMap(function level(l) {
    return groups.map(function group(g) {
      return {level: l.label, [key]: g, ...score(rows.filter(function m(r) { return r.level === l.id && r[key] === g; }))};
    });
  });
}

// Each level should cover each clip about equally; a skew means level and case difficulty are mixed up.
function balance(rows) {
  return study.clips.map(function clip(c) {
    return {clip: c.name, ...Object.fromEntries(study.levels.map(function count(l) { return [l.id, rows.filter(function m(r) { return r.clip === c.id && r.level === l.id; }).length]; }))};
  });
}

function allMarks(rows) {
  return rows.flatMap(function marks(r) { return trialMarks(r, clipFor(r.clip), study.questions); });
}

function ofLevel(items, id) {
  return items.filter(function m(x) { return x.level === id; });
}

function points(fraction) {
  return (100 * fraction).toFixed(1);
}

function levelStats(rows, marks) {
  const rule = study.decision;
  const base = study.levels.map(function stat(l) {
    return {id: l.id, camera: l.camera, assumption: l.assumption, accuracy: plainAccuracy(ofLevel(marks, l.id)), usable: usableMean(ofLevel(rows, l.id), rule.raterRoles)};
  });
  const ids = base.map(function id(s) { return s.id; });
  const intervals = differenceIntervals(marks, ids, bestLevel(base), rule.bootstrapRuns, rule.seed);
  return base.map(function join(s) { return {...s, ...intervals[s.id]}; });
}

function camera(id) {
  return cameras.find(function match(c) { return c.id === id; });
}

function statRow(s, marks) {
  const own = ofLevel(marks, s.id), c = camera(s.camera);
  return {level: s.id, part: cameraLabel(s, cameras), tipOdMm: c?.tipOdMm ?? '-', usd: c?.lowQtyUsd ?? '-', marks: own.length,
    correct: points(s.accuracy), vsBest95: `${points(s.lower)} to ${points(s.upper)}`,
    cantTell: own.reduce(function sum(n, m) { return n + m.cantTell; }, 0), usableEnt: s.usable.toFixed(2)};
}

function caveats(rows) {
  const lesionNo = study.clips.filter(function no(c) { return c.truth.lesion === 'No'; }).length;
  console.log(`Rule status: ${study.decision.status}. Patients: ${new Set(study.clips.map(function p(c) { return c.patient; })).size}. Lesion "No" clips: ${lesionNo}: lesion score is almost all sensitivity. Raters: ${new Set(rows.map(function s(r) { return r.session; })).size}.`);
}

function decide(rows) {
  const marks = allMarks(rows), stats = levelStats(rows, marks);
  console.table(stats.map(function row(s) { return statRow(s, marks); }));
  caveats(rows);
  console.log(JSON.stringify(verdict(stats, cameras, study.decision, new Set(rows.map(function s(r) { return r.session; })).size)));
}

function main(file) {
  if (!file) { console.error(JSON.stringify({event: 'quality.usage', usage: 'node tools/quality/analyze.cjs responses.csv'})); process.exitCode = 1; return; }
  const rows = cleanRows(parseCsv(fs.readFileSync(file, 'utf8')));
  if (!rows.length) { console.error(JSON.stringify({event: 'quality.no_rows', file})); process.exitCode = 1; return; }
  console.table(study.levels.map(function level(l) { return {level: l.label, camera: cameraLabel(l, cameras), ...score(rows.filter(function m(r) { return r.level === l.id; }))}; }));
  decide(rows);
  console.table(table(rows, 'setting'));
  console.table(table(rows, 'role'));
  console.table(balance(rows));
}

main(process.argv[2]);
