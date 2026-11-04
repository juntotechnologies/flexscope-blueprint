#!/usr/bin/env node
// Click walk: each step in tools/site/walk.json runs on a fresh page; screenshot + fail on page errors, page scroll or a missing expected state.
const fs = require('node:fs'), path = require('node:path');
const {launchBrowser} = require('../teardown/scripts/browser.cjs');

const WALK = require('./walk.json');

async function act(page, action) {
  if (action.click) await page.click(action.click);
  if (action.fill) await page.locator(action.fill[0]).fill(action.fill[1]);
  if (action.key) await page.keyboard.press(action.key);
  if (action.wait) await page.waitForTimeout(action.wait);
  if (action.ready) await page.waitForSelector(action.ready, {timeout: 20000});
}

async function runStep(browser, url, outDir, step) {
  const page = await browser.newPage({viewport: step.viewport, deviceScaleFactor: 2, colorScheme: step.colorScheme || 'light'});
  const errors = [];
  page.on('pageerror', function onError(e) { errors.push(e.message); });
  await page.goto(url + (step.path || '') + (step.hash || ''), {waitUntil: 'load'});
  const ready = step.pageReady ?? (step.hash ? null : WALK.ready);
  if (ready) await page.waitForSelector(ready, {timeout: 20000});
  for (const action of step.actions) await act(page, action);
  const expectOk = (step.expect ? await page.locator(step.expect).count() > 0 : true) && (step.expectJs ? await page.evaluate(step.expectJs) === true : true);
  const vscroll = await page.evaluate('document.documentElement.scrollHeight - document.documentElement.clientHeight');
  const file = path.join(outDir, `${step.name}.png`);
  await page.screenshot({path: file});
  await page.close();
  return {step: step.name, expectOk, vscroll, errors, file};
}

async function main(url, outDir) {
  fs.mkdirSync(outDir, {recursive: true});
  const browser = await launchBrowser();
  const results = [];
  for (const step of WALK.steps) results.push(await runStep(browser, url, outDir, step));
  await browser.close();
  for (const r of results) console.log(JSON.stringify(r));
  if (results.some(function bad(r) { return !r.expectOk || r.vscroll > 0 || r.errors.length; })) process.exitCode = 1;
}

main(process.argv[2], process.argv[3]);
