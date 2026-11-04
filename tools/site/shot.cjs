#!/usr/bin/env node
// Screenshot a page at each viewport in tools/site/viewports.json; fails on side scroll, page scroll or page errors. Usage: shot.cjs <url> <outDir> [readySelector]
const fs = require('node:fs'), path = require('node:path');
const {launchBrowser} = require('../teardown/scripts/browser.cjs');

const VIEWPORTS = require('./viewports.json');

async function shoot(browser, url, outDir, ready, v) {
  const page = await browser.newPage({viewport: {width: v.width, height: v.height}, deviceScaleFactor: 2});
  const errors = [];
  page.on('pageerror', function onError(e) { errors.push(e.message); });
  await page.goto(url, {waitUntil: 'load'});
  if (ready) await page.waitForSelector(ready, {timeout: 20000});
  await page.waitForTimeout(ready ? 600 : 2500);
  const overflow = await page.evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth');
  const vscroll = await page.evaluate('document.documentElement.scrollHeight - document.documentElement.clientHeight');
  const file = path.join(outDir, `${v.name}.png`);
  await page.screenshot({path: file, fullPage: v.full === true});
  await page.close();
  return {viewport: v.name, overflow, vscroll, errors, file};
}

async function main(url, outDir, ready) {
  fs.mkdirSync(outDir, {recursive: true});
  const browser = await launchBrowser();
  const results = [];
  for (const v of VIEWPORTS) results.push(await shoot(browser, url, outDir, ready, v));
  await browser.close();
  for (const r of results) console.log(JSON.stringify(r));
  if (results.some(function bad(r) { return r.overflow > 0 || r.vscroll > 0 || r.errors.length; })) process.exitCode = 1;
}

main(process.argv[2], process.argv[3], process.argv[4]);
