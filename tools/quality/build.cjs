#!/usr/bin/env node
// Build the quality test page from tools/quality/study.json → <out>/index.html. True answers stay out of the page.
const fs = require('node:fs'), path = require('node:path');

const root = path.resolve(__dirname, '../..');
const study = require('./study.json');
const site = require('../../site/site.json');
const {buildMode} = require('./mode.cjs');

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

// Only the opaque clip id ships; names, truth and credits stay out of the page.
function pageStudy(clips) {
  return {
    clips: clips.map(function shown(c) { return {id: c.id}; }),
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

function pageHtml(clips) {
  return fill(read('site/quality/template.html'), {
    title: escapeHtml(study.title), minutes: study.minutes, clipCount: clips.length, questionCount: study.questions.length,
    css: read('site/tokens.css') + read('site/quality/quality.css'), js: read('site/quality/quality.js').replace(/<\/script/gi, '<\\/script'),
    contactPurpose: escapeHtml(study.contact.purpose), contactAccess: escapeHtml(study.contact.access), contactConsent: escapeHtml(study.contact.consent), contactMail: escapeHtml(site.privacy.contact),
    raterFields: study.rater.map(fieldset).join(''), questionFields: study.questions.map(fieldset).join(''),
    study: JSON.stringify(pageStudy(clips)).replaceAll('<', '\\u003c')
  });
}

// Levels rotate over clips from a random offset: balanced across raters always; within one rater only when clips is a multiple of levels.
function warnBalance(clips) {
  if (clips.length % study.levels.length) console.error(JSON.stringify({event: 'quality.rater_unbalanced', severity: 'warn', clips: clips.length, levels: study.levels.length}));
}

// CC BY: credit, copyright notice, link to source + license, note of changes (credits.html). Separate page: titles name findings.
function creditItem(clip) {
  const c = clip.credit;
  return `<li>${escapeHtml(c.work)}, ${escapeHtml(c.part)}. ${escapeHtml(c.copyright)}. <a href="${escapeHtml(c.url)}">${escapeHtml(c.url)}</a>. ` +
    `License: <a href="${escapeHtml(c.licenseUrl)}">${escapeHtml(c.license)}</a>.</li>`;
}

function creditsHtml(clips) {
  return fill(read('site/quality/credits.html'), {
    title: escapeHtml(study.title), css: read('site/tokens.css') + read('site/quality/quality.css'),
    items: clips.filter(function credited(c) { return c.credit; }).map(creditItem).join('')
  });
}

function main(mode) {
  warnBalance(mode.clips);
  fs.mkdirSync(mode.out, {recursive: true});
  fs.writeFileSync(path.join(mode.out, 'index.html'), pageHtml(mode.clips));
  fs.writeFileSync(path.join(mode.out, 'credits.html'), creditsHtml(mode.clips));
  console.log(path.join(mode.out, 'index.html'));
}

main(buildMode(process.argv));
