#!/usr/bin/env node
// Make every clip × level from tools/quality/study.json with ffmpeg → <out>/<clipBase><id>-<level>.mp4.
// Default: open-license clips (tools/quality/open/<name>.mp4, committed) → public build (study.out).
// `--real`: private clips (tools/quality/sources/<name>.mp4, gitignored) → private build (study.privateOut, gitignored).
const fs = require('node:fs'), path = require('node:path'), {execFileSync} = require('node:child_process');
const {buildMode} = require('./mode.cjs');

const study = require('./study.json');
const SOURCE_DIRS = {open: 'open', private: 'sources'};
const SQUARE = "'min(iw,ih)':'min(iw,ih)'";

function levelFilter(clip, level) {
  const steps = [`crop=${clip.crop ?? SQUARE}`, `scale=${level.size}:${level.size}:flags=area`];
  if (level.blur) steps.push(`gblur=sigma=${level.blur}`);
  if (level.noise) steps.push(`noise=alls=${level.noise}:allf=t`);
  steps.push(`fps=${level.fps}`, 'format=yuv420p');
  return steps.join(',');
}

function encode(clip, level, file) {
  const input = path.join(__dirname, SOURCE_DIRS[clip.source], clip.name + '.mp4');
  const args = ['-y', '-loglevel', 'error', '-ss', String(clip.start), '-i', input, '-t', String(clip.seconds), '-vf', levelFilter(clip, level),
    '-c:v', 'libx264', '-profile:v', 'baseline', '-crf', '23', '-maxrate', '3M', '-bufsize', '6M', '-movflags', '+faststart', '-an', file];
  execFileSync('ffmpeg', args, {stdio: 'inherit'});
}

function main(mode) {
  const dir = path.join(mode.out, study.clipBase);
  fs.mkdirSync(dir, {recursive: true});
  for (const clip of mode.clips) {
    for (const level of study.levels) {
      const file = path.join(dir, `${clip.id}-${level.id}.mp4`);
      encode(clip, level, file);
      console.log(JSON.stringify({event: 'quality.clip', clip: clip.id, level: level.id, bytes: fs.statSync(file).size}));
    }
  }
}

main(buildMode(process.argv));
