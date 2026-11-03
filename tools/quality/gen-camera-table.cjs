#!/usr/bin/env node
// Write the camera table from cameras.json into README between markers; --check fails on drift.
const fs = require('node:fs'), path = require('node:path');
const data = require('./cameras.json');

const README = path.resolve(__dirname, '../../README.md');
const BLOCK = /(<!-- cameras:begin -->\n)[\s\S]*?(<!-- cameras:end -->)/;
const REQUIRED = ['id', 'part', 'pixels', 'tipOdMm', 'fitsTip', 'lowQtyUsd', 'class', 'source'];
const CLASSES = ['seller-list', 'snippet', 'unknown'];

function rowIssues(camera) {
  const missing = REQUIRED.filter(function absent(field) { return camera[field] === undefined || camera[field] === ''; });
  const badClass = CLASSES.includes(camera.class) ? [] : ['class'];
  const badSource = /^https:\/\//.test(camera.source || '') ? [] : ['source'];
  return [...missing, ...badClass, ...badSource].map(function label(field) { return `${camera.id}: ${field}`; });
}

function issues(cameras) {
  return cameras.flatMap(rowIssues);
}

function tableRow(camera) {
  const cells = [camera.part, camera.pixels, `${camera.tipOdMm} mm`, camera.fitsTip, `$${camera.lowQtyUsd}`, `[${camera.class}](${camera.source})`];
  return `| ${cells.join(' | ')} |`;
}

function table(content) {
  const head = '| Part | Pixels | Tip OD | Fits 3.5 mm tip | List price, low qty | Evidence |\n|---|---|---|---|---|---|';
  return `${head}\n${content.cameras.map(tableRow).join('\n')}\n\nSeen ${content.seen}. List prices, not quotes; nothing ordered.\n`;
}

function render(readme, content) {
  if (!BLOCK.test(readme)) throw Error(JSON.stringify({event: 'cameras.no_block'}));
  return readme.replace(BLOCK, function block(_, begin, end) { return `${begin}${table(content)}${end}`; });
}

function main(check) {
  const found = issues(data.cameras);
  if (found.length) throw Error(JSON.stringify({event: 'cameras.invalid', found}));
  const before = fs.readFileSync(README, 'utf8'), after = render(before, data);
  if (check && before !== after) throw Error(JSON.stringify({event: 'cameras.readme_drift'}));
  if (!check) fs.writeFileSync(README, after);
}

if (require.main === module) main(process.argv.includes('--check'));

module.exports = {issues, render};
