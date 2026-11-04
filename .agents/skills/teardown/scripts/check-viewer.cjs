#!/usr/bin/env node
const fs = require('node:fs'), path = require('node:path');
const {launchBrowser} = require('./browser.cjs');

const TIMEOUT = 60000;
const VIEWPORT = {width: 1400, height: 900};
const LOCAL_URL = /^(file|data|blob|about):/;
const IS_IDLE = "document.getElementById('viewport')?.getAttribute('aria-busy') === 'false'";
const RENDER_STATE = `({status: document.getElementById('render-status')?.textContent ?? '', message: document.getElementById('message')?.textContent ?? '', parts: document.querySelectorAll('#drawing [data-item]').length})`;
const DRAWINGS = `JSON.parse(document.getElementById('drawing-data').textContent).map(d => ({id: d.id, parts: d.parts.length}))`;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const networkProblem = url => 'Network request: ' + url;

function showDrawing(id) {
  const select = document.getElementById('subject');
  if (select.value === id) return;
  select.value = id;
  select.dispatchEvent(new Event('change'));
}

class Findings {
  problems = [];
  requests = [];
  onPageError = error => this.problems.push('Page error: ' + error.message);
  onConsole = message => { if (message.type() === 'error') this.problems.push('Console error: ' + message.text()); };
  onRequest = request => { if (!LOCAL_URL.test(request.url())) this.requests.push(request.url()); };

  watch(page) {
    page.on('pageerror', this.onPageError);
    page.on('console', this.onConsole);
    page.on('request', this.onRequest);
  }

  all() {
    return [...this.problems, ...this.requests.map(networkProblem)];
  }
}

async function settle(page) {
  await sleep(300);
  await page.waitForFunction(IS_IDLE, null, {timeout: TIMEOUT, polling: 200});
  return page.evaluate(RENDER_STATE);
}

async function checkDrawing(page, drawing, shotFile, problems) {
  await page.evaluate(showDrawing, drawing.id);
  const state = await settle(page);
  const ok = state.status === 'Drawing updated' && state.parts === drawing.parts;
  if (!ok) problems.push(`${drawing.id}: status "${state.status || state.message}", ${state.parts} of ${drawing.parts} parts drawn`);
  await page.screenshot({path: shotFile});
  return {id: drawing.id, ok, parts: state.parts, file: shotFile};
}

async function checkDrawings(page, outDir, dark, problems) {
  await settle(page);
  const results = [];
  for (const drawing of await page.evaluate(DRAWINGS)) {
    results.push(await checkDrawing(page, drawing, path.resolve(outDir, `viewer-${drawing.id}${dark ? '-dark' : ''}.png`), problems));
  }
  return results;
}

function report(results, problems) {
  for (const r of results) console.log(`${r.ok ? 'OK' : 'FAILED'} ${r.id}: ${r.parts} parts drawn, screenshot ${r.file}`);
  for (const p of problems) console.warn('PROBLEM ' + p);
  if (problems.length) process.exitCode = 1;
  return {results, problems};
}

async function check(htmlPath, outDir, {dark = false} = {}) {
  const pagePath = path.resolve(htmlPath);
  if (!fs.existsSync(pagePath)) throw Error(`No page at ${pagePath}`);
  fs.mkdirSync(outDir, {recursive: true});
  const browser = await launchBrowser(), findings = new Findings();
  try {
    const page = await browser.newPage({viewport: VIEWPORT, colorScheme: dark ? 'dark' : 'light'});
    findings.watch(page);
    await page.goto('file://' + pagePath);
    const results = await checkDrawings(page, outDir, dark, findings.problems);
    return report(results, findings.all());
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  const args = process.argv.slice(2), [htmlPath, outDir] = args.filter(a => !a.startsWith('--'));
  if (!htmlPath || !outDir) {
    console.error('Usage: node check-viewer.cjs dist/index.html check/ [--dark]');
    process.exitCode = 1;
  } else {
    check(htmlPath, outDir, {dark: args.includes('--dark')}).catch(e => {
      console.error(e.stack);
      process.exitCode = 1;
    });
  }
}
module.exports = check;
