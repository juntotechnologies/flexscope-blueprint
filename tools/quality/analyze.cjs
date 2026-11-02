#!/usr/bin/env node
// Score answers per quality level (and per setting) from a CSV export of the "responses" sheet.
// Usage: node tools/quality/analyze.cjs responses.csv
const fs = require('node:fs');
const study = require('./study.json');

function parseCsv(text) {
  const [head, ...lines] = text.trim().split(/\r?\n/).map(function cells(line) { return line.split(','); });
  return lines.map(function row(cells) { return Object.fromEntries(head.map(function pair(h, i) { return [h, cells[i]]; })); });
}

function clipFor(clipId) {
  return study.clips.find(function match(c) { return c.id === clipId; }) ?? {};
}

function truthFor(clipId) {
  return clipFor(clipId).truth ?? {};
}

function score(rows) {
  const scored = study.questions.filter(function s(q) { return q.scored; });
  const stats = {n: rows.length};
  for (const q of scored) {
    const right = rows.filter(function ok(r) { return r[q.id] === truthFor(r.clip)[q.id]; }).length;
    stats[q.id + 'Correct'] = rows.length ? Math.round(100 * right / rows.length) + '%' : '-';
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

function main(file) {
  const rows = parseCsv(fs.readFileSync(file, 'utf8')).filter(function real(r) { return process.argv.includes('--demo') || !clipFor(r.clip).demo; });
  console.table(study.levels.map(function level(l) { return {level: l.label, camera: l.cameraClass, ...score(rows.filter(function m(r) { return r.level === l.id; }))}; }));
  console.table(table(rows, 'setting'));
}

main(process.argv[2]);
