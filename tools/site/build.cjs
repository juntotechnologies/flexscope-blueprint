#!/usr/bin/env node
// Build the Pages site: one-screen page = live teardown drawing + README sections as tabs → dist-site/.
const fs = require('node:fs'), path = require('node:path');
const {Marked} = require('marked');
const {RUNTIME, assets, load} = require('../teardown/scripts/config.cjs');
const SHEET = require('../teardown/assets/sheet.js');
const {inkFromHue, GRAPHITE} = require('./ink.cjs');

const root = path.resolve(__dirname, '../..');
const site = readJson('site/site.json');
const data = readJson('drawing/data.json');
const out = path.join(root, site.out);

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
}

function read(rel) {
  return fs.readFileSync(path.resolve(root, rel), 'utf8');
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"]/g, function swap(c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]; });
}

// Inline <script> bodies and JSON islands must not close their tag early.
function scriptSafe(text) {
  return text.replace(/<\/script/gi, '<\\/script');
}

function jsonIsland(value) {
  return JSON.stringify(value).replaceAll('<', '\\u003c');
}

// ---- markdown ----

// Tables render with data-label per cell so CSS can stack rows into cards on phones.
function renderTable(token) {
  const labels = token.header.map(function text(cell) { return this.parser.parseInline(cell.tokens); }, this);
  const head = labels.map(function th(label) { return `<th>${label}</th>`; }).join('');
  const rows = token.rows.map(function row(cells) {
    return '<tr>' + cells.map(function td(cell, i) { return `<td data-label="${escapeHtml(labels[i].replace(/<[^>]+>/g, ''))}">${this.parser.parseInline(cell.tokens)}</td>`; }, this).join('') + '</tr>';
  }, this).join('');
  return `<div class="table"><table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>`;
}

function renderLink(token) {
  const external = /^https?:/.test(token.href) ? ' rel="noopener" target="_blank"' : '';
  return `<a href="${escapeHtml(token.href)}"${external}>${this.parser.parseInline(token.tokens)}</a>`;
}

function markdown() {
  return new Marked({renderer: {table: renderTable, link: renderLink}});
}

// README → {intro, sections: {title: body}} split on "## " headings.
function splitReadme(text) {
  const [head, ...rest] = text.split(/^## /m);
  const intro = head.replace(/^# .*\n/, '').split('\n').filter(function keep(line) { return !/^Site: /.test(line); }).join('\n');
  const sections = {};
  for (const chunk of rest) {
    const [title, ...body] = chunk.split('\n');
    sections[title.trim()] = body.join('\n');
  }
  return {intro, sections};
}

function tabBody(tab, readme) {
  if (tab.section === null) return readme.intro;
  if (!(tab.section in readme.sections)) throw Error(JSON.stringify({event: 'site.tab_section_missing', tab: tab.id, section: tab.section}));
  return readme.sections[tab.section];
}

// ---- fragments ----

function detailTabs() {
  return site.tabs.map(function tab(t, i) {
    return `<button type="button" role="tab" id="tab-${t.id}" aria-controls="panel-${t.id}" aria-selected="${i === 0}">${escapeHtml(t.label)}</button>`;
  }).join('');
}

function detailPanels(md, readme) {
  return site.tabs.map(function panel(t, i) {
    return `<div class="tab-panel card" role="tabpanel" id="panel-${t.id}" aria-labelledby="tab-${t.id}"${i ? ' hidden' : ''}>${md.parse(tabBody(t, readme))}</div>`;
  }).join('');
}

function drawingTabs() {
  return data.drawings.map(function tab(d) { return `<button type="button" data-drawing="${d.id}">${escapeHtml(d.short)}</button>`; }).join('');
}

function viewButtons() {
  return site.views.map(function button(v) { return `<button type="button" data-view="${v.id}">${escapeHtml(v.label)}</button>`; }).join('');
}

function dockButtons() {
  return site.panes.map(function button(p) { return `<button type="button" data-pane="${p.id}">${escapeHtml(p.label)}</button>`; }).join('');
}

function dwgHtml(d, i) {
  const number = `${site.dwgPrefix}-${String(i + 1).padStart(3, '0')}`;
  return `<span>DWG <b>${number}</b></span> <b>${escapeHtml(d.title.replace(/ \(concept\)$/, ''))}</b> <span>NTS</span>`;
}

function inks(hues) {
  return Object.fromEntries(Object.entries(hues).map(function hex([part, hue]) { return [part, inkFromHue(hue)]; }));
}

function drawingData() {
  return data.drawings.map(function page(d, i) {
    return {id: d.id, title: d.title, initialView: d.initialView, parameters: d.parameters, baseInk: GRAPHITE, inks: inks(d.colors.hues), fills: d.colors.fills, dwgHtml: dwgHtml(d, i)};
  });
}

function workerSource() {
  const {modelScripts} = load(path.join(root, 'drawing/drawing.json'));
  return [...RUNTIME, ...modelScripts, path.join(assets, 'worker.js')].map(read).join('\n');
}

function engine() {
  return ['sheet.js', 'render-queue.js'].map(function asset(name) { return read(path.join(assets, name)); }).join('\n');
}

function fill(template, values) {
  return template.replace(/\{\{(\w+)\}\}/g, function value(_, key) {
    if (!(key in values)) throw Error('Unknown template key ' + key);
    return values[key];
  });
}

function pageHtml() {
  const md = markdown(), readme = splitReadme(read('README.md'));
  return fill(read('site/template.html'), {
    title: escapeHtml(site.title), description: escapeHtml(site.description), url: site.url,
    css: read('site/tokens.css') + read('site/site.css'), lineCss: SHEET.css('technical'), js: scriptSafe(read('site/site.js')), engine: scriptSafe(engine()),
    word1: site.wordmark[0], word2: site.wordmark[1], tagline: escapeHtml(site.tagline), repo: site.repo, repoLabel: site.repoLabel,
    orgName: site.org.name, orgUrl: site.org.url, chip: escapeHtml(site.chip),
    drawingTabs: drawingTabs(), viewButtons: viewButtons(), dockButtons: dockButtons(),
    detailTabs: detailTabs(), detailPanels: detailPanels(md, readme),
    drawingData: jsonIsland(drawingData()), workerSource: jsonIsland(workerSource())
  });
}

function copyAssets() {
  const files = {
    'fonts/inter.woff2': 'node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2',
    'fonts/plex-400.woff2': 'node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2',
    'fonts/plex-500.woff2': 'node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2',
    'favicon.svg': 'site/favicon.svg',
    'og.png': 'docs/img/scope-default-exploded.png'
  };
  for (const [to, from] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(out, to)), {recursive: true});
    fs.copyFileSync(path.join(root, from), path.join(out, to));
  }
}

function main() {
  fs.rmSync(out, {recursive: true, force: true});
  fs.mkdirSync(out, {recursive: true});
  copyAssets();
  fs.writeFileSync(path.join(out, 'index.html'), pageHtml());
  fs.writeFileSync(path.join(out, 'robots.txt'), `User-agent: *\nAllow: /\n`);
  console.log(path.join(out, 'index.html'));
}

main();
