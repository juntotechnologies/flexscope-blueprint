#!/usr/bin/env node
// Score answers per quality level (and per setting) from a CSV export of the "responses" sheet.
// Usage: node tools/quality/analyze.cjs responses.csv
const fs = require('node:fs');
const study = require('./study.json');

// RFC 4180: quoted fields may hold commas, quotes ("") and newlines.
function csvRecords(text) {
  const records = [[]];
  let field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted && c === '"' && text[i + 1] === '"') { field += '"'; i++; } else if (c === '"') quoted = !quoted;
    else if (!quoted && c === ',') { records.at(-1).push(field); field = ''; } else if (!quoted && (c === '\n' || c === '\r')) {
      if (c === '\r' && text[i + 1] === '\n') i++;
      records.at(-1).push(field); field = ''; records.push([]);
    } else field += c;
  }
  records.at(-1).push(field);
  return records.filter(function nonEmpty(r) { return r.some(Boolean); });
}

function parseCsv(text) {
  const [head, ...lines] = csvRecords(text);
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
    const known = rows.filter(function hasTruth(r) { return q.id in truthFor(r.clip); });
    const right = known.filter(function ok(r) { return r[q.id] === truthFor(r.clip)[q.id]; }).length;
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
    return {clip: c.id, ...Object.fromEntries(study.levels.map(function count(l) { return [l.id, rows.filter(function m(r) { return r.clip === c.id && r.level === l.id; }).length]; }))};
  });
}

function main(file) {
  const rows = parseCsv(fs.readFileSync(file, 'utf8')).filter(function known(r) { return study.clips.some(function m(c) { return c.id === r.clip; }); });
  if (!rows.length) { console.error(JSON.stringify({event: 'quality.no_rows', file})); process.exitCode = 1; return; }
  console.table(study.levels.map(function level(l) { return {level: l.label, camera: l.cameraClass, ...score(rows.filter(function m(r) { return r.level === l.id; }))}; }));
  console.table(table(rows, 'setting'));
  console.table(balance(rows));
}

main(process.argv[2]);
