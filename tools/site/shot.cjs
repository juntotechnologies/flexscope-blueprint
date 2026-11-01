#!/usr/bin/env node
// Screenshot a page at each viewport in tools/site/viewports.json. Usage: shot.cjs <url> <outDir> [--wait=<css selector>]
const fs = require('node:fs'), path = require('node:path');
const {chromium} = require('playwright-core');
const {findChrome} = require('../teardown/scripts/commands.cjs');

const VIEWPORTS = require('./viewports.json');

async function shoot(browser, url, outDir, v) {
  const page = await browser.newPage({viewport: {width: v.width, height: v.height}, deviceScaleFactor: 2});
  const errors = [];
  page.on('pageerror', function onError(e) { errors.push(e.message); });
  await page.goto(url, {waitUntil: 'load'});
  await page.waitForTimeout(2500);
  const overflow = await page.evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth');
  const file = path.join(outDir, `${v.name}.png`);
  await page.screenshot({path: file, fullPage: v.full === true});
  await page.close();
  return {viewport: v.name, overflow, errors, file};
}

async function main(url, outDir) {
  fs.mkdirSync(outDir, {recursive: true});
  const browser = await chromium.launch({executablePath: process.env.SHOT_CHROME_PATH || findChrome()});
  const results = [];
  for (const v of VIEWPORTS) results.push(await shoot(browser, url, outDir, v));
  await browser.close();
  for (const r of results) console.log(JSON.stringify(r));
  if (results.some(function bad(r) { return r.overflow > 0 || r.errors.length; })) process.exitCode = 1;
}

main(process.argv[2], process.argv[3]);
