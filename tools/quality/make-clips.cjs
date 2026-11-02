#!/usr/bin/env node
// Make every clip × level from tools/quality/study.json with ffmpeg → <out>/<clipBase><clip>-<level>.mp4.
// Default: synthetic demo clips only → public site build. `--real`: real clips from tools/quality/sources/<clip>.mp4
// → tools/quality/private-clips/ (both gitignored), never into the public site output.
const fs = require('node:fs'), path = require('node:path'), {execFileSync} = require('node:child_process');

const root = path.resolve(__dirname, '../..');
const study = require('./study.json');
const SYNTHETIC = {demo1: 'testsrc2=size=1080x1080:rate=30', demo2: 'mandelbrot=size=1080x1080:rate=30'};

function levelFilter(level) {
  const steps = ["crop='min(iw,ih)':'min(iw,ih)'", `scale=${level.size}:${level.size}:flags=area`];
  if (level.blur) steps.push(`gblur=sigma=${level.blur}`);
  if (level.noise) steps.push(`noise=alls=${level.noise}:allf=t`);
  steps.push(`fps=${level.fps}`, 'format=yuv420p');
  return steps.join(',');
}

function inputArgs(clip) {
  if (clip.source === 'synthetic') return ['-f', 'lavfi', '-i', SYNTHETIC[clip.id]];
  return ['-i', path.join(__dirname, 'sources', clip.id + '.mp4')];
}

function encode(clip, level, file) {
  const args = ['-y', '-loglevel', 'error', ...inputArgs(clip), '-t', String(clip.seconds), '-vf', levelFilter(level),
    '-c:v', 'libx264', '-profile:v', 'baseline', '-crf', '23', '-movflags', '+faststart', '-an', file];
  execFileSync('ffmpeg', args, {stdio: 'inherit'});
}

function main(real) {
  const dir = real ? path.join(__dirname, 'private-clips') : path.join(root, study.out, study.clipBase);
  fs.mkdirSync(dir, {recursive: true});
  for (const clip of study.clips.filter(function wanted(c) { return (c.source === 'synthetic') !== real; })) {
    for (const level of study.levels) {
      const file = path.join(dir, `${clip.id}-${level.id}.mp4`);
      encode(clip, level, file);
      console.log(JSON.stringify({event: 'quality.clip', clip: clip.id, level: level.id, bytes: fs.statSync(file).size}));
    }
  }
}

main(process.argv.includes('--real'));
