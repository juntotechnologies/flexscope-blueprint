#!/usr/bin/env node
// Build the quality test page from tools/quality/study.json → <out>/index.html. True answers stay out of the page.
const fs = require('node:fs'), path = require('node:path');

const root = path.resolve(__dirname, '../..');
const study = require('./study.json');

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"]/g, function swap(c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]; });
}

function choice(name, option) {
  return `<label><input type="radio" name="${name}" value="${escapeHtml(option)}" required><span>${escapeHtml(option)}</span></label>`;
}

function fieldset(field) {
  const options = field.options.map(function radio(o) { return choice(field.id, o); }).join('');
  return `<fieldset><legend>${escapeHtml(field.text)}</legend><div class="choices">${options}</div></fieldset>`;
}

function pageStudy() {
  return {
    clips: study.clips.map(function shown(c) { return {id: c.id, demo: c.demo === true}; }),
    levels: study.levels.map(function id(l) { return {id: l.id}; }),
    questions: study.questions.map(function id(q) { return {id: q.id}; }),
    rater: study.rater.map(function id(r) { return {id: r.id}; }),
    clipBase: study.clipBase, endpoint: study.endpoint
  };
}

function fill(template, values) {
  return template.replace(/\{\{(\w+)\}\}/g, function value(_, key) {
    if (!(key in values)) throw Error('Unknown template key ' + key);
    return values[key];
  });
}

function pageHtml() {
  return fill(read('site/quality/template.html'), {
    title: escapeHtml(study.title), minutes: study.minutes, clipCount: study.clips.length,
    css: read('site/tokens.css') + read('site/quality/quality.css'), js: read('site/quality/quality.js').replace(/<\/script/gi, '<\\/script'),
    raterFields: study.rater.map(fieldset).join(''), questionFields: study.questions.map(fieldset).join(''),
    study: JSON.stringify(pageStudy()).replaceAll('<', '\\u003c')
  });
}

// Levels rotate over clips; a clip count that is a multiple of the level count gives every rater every level equally.
function checkBalance() {
  const real = study.clips.filter(function r(c) { return !c.demo; }).length;
  if (real && real % study.levels.length) throw Error(JSON.stringify({event: 'quality.unbalanced', clips: real, levels: study.levels.length}));
}

function main() {
  checkBalance();
  const out = path.join(root, study.out);
  fs.mkdirSync(out, {recursive: true});
  fs.writeFileSync(path.join(out, 'index.html'), pageHtml());
  console.log(path.join(out, 'index.html'));
}

main();
