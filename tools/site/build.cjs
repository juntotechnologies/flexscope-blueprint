#!/usr/bin/env node
// Build the Pages site: README.md body + drawing SVGs + viewer into dist-site/.
const fs = require('node:fs'), path = require('node:path');
const {Marked} = require('marked');

const root = path.resolve(__dirname, '../..');
const site = readJson('site/site.json');
const data = readJson('drawing/data.json');
const out = path.join(root, site.out);

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"]/g, function swap(c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]; });
}

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

// README → {intro, sections[]} split on "## " headings; skipSections dropped.
function splitReadme(text) {
  const [head, ...rest] = text.split(/^## /m);
  const intro = head.replace(/^# .*\n/, '').split('\n').filter(function keep(line) { return !/^Site: /.test(line); }).join('\n');
  const sections = rest.map(function section(chunk) {
    const [title, ...body] = chunk.split('\n');
    return {title: title.trim(), body: body.join('\n')};
  }).filter(function shown(s) { return !site.skipSections.includes(s.title); });
  return {intro, sections};
}

function sectionHtml(md, s) {
  const id = s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `<section class="card" id="${id}"><h2>${escapeHtml(s.title)}</h2>${md.parse(s.body)}</section>`;
}

function inkBounds(svg) {
  const xs = [], ys = [];
  for (const d of svg.matchAll(/ d="([^"]+)"/g)) {
    const n = d[1].match(/-?\d+(?:\.\d+)?/g).map(Number);
    for (let i = 0; i + 1 < n.length; i += 2) { xs.push(n[i]); ys.push(n[i + 1]); }
  }
  const pad = 4, x = Math.min(...xs) - pad, y = Math.min(...ys) - pad;
  return `${x.toFixed(1)} ${y.toFixed(1)} ${(Math.max(...xs) + pad - x).toFixed(1)} ${(Math.max(...ys) + pad - y).toFixed(1)}`;
}

function inlineSvg(drawingId, view) {
  const svg = read(`docs/img/${drawingId}-default-${view}.svg`).replace(/<style>[\s\S]*?<\/style>/, '').replace(/ width="420mm" height="297mm"/, '').replace(/<rect [^>]*fill="#fff"\/>/, '');
  return svg.replace(/viewBox="[^"]*"/, `viewBox="${inkBounds(svg)}"`).replace('<svg ', `<svg role="img" class="sheet" data-drawing="${drawingId}" data-view="${view}" `);
}

function drawingSheets() {
  const sheets = [];
  for (const d of data.drawings) for (const v of site.views) sheets.push(inlineSvg(d.id, v.id));
  return sheets.join('\n');
}

function segmented(name, options) {
  const buttons = options.map(function button(o, i) { return `<button type="button" data-${name}="${o.id}" aria-pressed="${i === 0}">${escapeHtml(o.label)}</button>`; }).join('');
  return `<div class="seg" role="group" aria-label="${name}">${buttons}</div>`;
}

function drawingOptions() {
  return data.drawings.map(function option(d) { return {id: d.id, label: d.short}; });
}

function dwgLabels() {
  return data.drawings.map(function label(d, i) {
    const number = `${site.dwgPrefix}-${String(i + 1).padStart(3, '0')}`;
    return `<p class="dwg" data-drawing="${d.id}"><span>DWG <b>${number}</b></span> <b>${escapeHtml(d.title.replace(/ \(concept\)$/, ''))}</b></p>`;
  }).join('');
}

function fill(template, values) {
  return template.replace(/\{\{(\w+)\}\}/g, function value(_, key) {
    if (!(key in values)) throw Error('Unknown template key ' + key);
    return values[key];
  });
}

function pageHtml() {
  const md = markdown(), {intro, sections} = splitReadme(read('README.md'));
  return fill(read('site/template.html'), {
    title: escapeHtml(site.title), description: escapeHtml(site.description), url: site.url,
    css: read('site/site.css'), js: read('site/site.js'),
    word1: site.wordmark[0], word2: site.wordmark[1], repo: site.repo, repoLabel: site.repoLabel,
    chip: escapeHtml(site.chip), sheets: drawingSheets(), dwg: dwgLabels(),
    drawingSwitch: segmented('drawing', drawingOptions()), viewSwitch: segmented('view', site.views),
    viewerLabel: site.viewerLabel, intro: md.parse(intro), sections: sections.map(function html(s) { return sectionHtml(md, s); }).join('\n'),
    orgName: site.org.name, orgUrl: site.org.url
  });
}

function copyAssets() {
  const fonts = {
    'fonts/inter.woff2': 'node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2',
    'fonts/plex-400.woff2': 'node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2',
    'fonts/plex-500.woff2': 'node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2',
    'viewer/index.html': 'dist/index.html',
    'favicon.svg': 'site/favicon.svg',
    'og.png': 'docs/img/scope-default-exploded.png'
  };
  for (const [to, from] of Object.entries(fonts)) {
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
