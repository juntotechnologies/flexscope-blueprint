#!/usr/bin/env node
// Measure how far each level sits from the top level, per clip (ffmpeg SSIM, 1 = same). Needs built clips: npm run quality.
const fs = require('node:fs'), path = require('node:path'), {execFileSync, spawnSync} = require('node:child_process');
const study = require('./study.json'), {cropSize, parseSsim, nearPairs} = require('./levels.cjs');

const root = path.resolve(__dirname, '../..');
const top = study.levels[0];

function clipFile(clip, level) {
  return path.join(root, study.out, study.clipBase, `${clip.id}-${level.id}.mp4`);
}

function sourceSize(clip) {
  const fromCrop = cropSize(clip.crop);
  if (fromCrop) return fromCrop;
  const out = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', path.join(__dirname, 'open', clip.name + '.mp4')]);
  return Math.min(...String(out).trim().split(',').map(Number));
}

function ssim(clip, level) {
  const filter = `[0]scale=${top.size}:${top.size}:flags=bicubic,fps=${top.fps}[a];[1]fps=${top.fps}[b];[a][b]ssim`;
  const run = spawnSync('ffmpeg', ['-i', clipFile(clip, level), '-i', clipFile(clip, top), '-lavfi', filter, '-f', 'null', '-'], {encoding: 'utf8'});
  return parseSsim(run.stderr);
}

function clipRows(clip) {
  const source = sourceSize(clip);
  return study.levels.map(function row(level) {
    return {clip: clip.name, level: level.id, ssim: ssim(clip, level), upscaled: level.size > source};
  });
}

function main() {
  const clips = study.clips.filter(function built(c) { return fs.existsSync(clipFile(c, top)); });
  if (!clips.length) { console.error(JSON.stringify({event: 'quality.no_clips', dir: study.out})); process.exitCode = 1; return; }
  const rows = clips.map(clipRows);
  console.table(rows.flat().map(function shown(r) { return {...r, ssim: r.ssim.toFixed(3)}; }));
  for (const clipLevels of rows) {
    const near = nearPairs(clipLevels);
    if (near.length) console.error(JSON.stringify({event: 'quality.levels_too_close', severity: 'warn', clip: clipLevels[0].clip, pairs: near}));
  }
}

main();
