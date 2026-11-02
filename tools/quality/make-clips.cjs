#!/usr/bin/env node
// Make every clip × level from tools/quality/study.json with ffmpeg → <out>/<clipBase><clip>-<level>.mp4.
// Default: open-license clips (tools/quality/open/<clip>.mp4, committed) → public site build.
// `--real`: private clips (tools/quality/sources/<clip>.mp4) → tools/quality/private-clips/ (both gitignored), never public.
const fs = require('node:fs'), path = require('node:path'), {execFileSync} = require('node:child_process');

const root = path.resolve(__dirname, '../..');
const study = require('./study.json');
const SOURCE_DIRS = {open: 'open', private: 'sources'};

function levelFilter(level) {
  const steps = ["crop='min(iw,ih)':'min(iw,ih)'", `scale=${level.size}:${level.size}:flags=area`];
  if (level.blur) steps.push(`gblur=sigma=${level.blur}`);
  if (level.noise) steps.push(`noise=alls=${level.noise}:allf=t`);
  steps.push(`fps=${level.fps}`, 'format=yuv420p');
  return steps.join(',');
}

function encode(clip, level, file) {
  const input = path.join(__dirname, SOURCE_DIRS[clip.source], clip.id + '.mp4');
  const args = ['-y', '-loglevel', 'error', '-ss', String(clip.start), '-i', input, '-t', String(clip.seconds), '-vf', levelFilter(level),
    '-c:v', 'libx264', '-profile:v', 'baseline', '-crf', '23', '-movflags', '+faststart', '-an', file];
  execFileSync('ffmpeg', args, {stdio: 'inherit'});
}

function main(real) {
  const dir = real ? path.join(__dirname, 'private-clips') : path.join(root, study.out, study.clipBase);
  const source = real ? 'private' : 'open';
  fs.mkdirSync(dir, {recursive: true});
  for (const clip of study.clips.filter(function wanted(c) { return c.source === source; })) {
    for (const level of study.levels) {
      const file = path.join(dir, `${clip.id}-${level.id}.mp4`);
      encode(clip, level, file);
      console.log(JSON.stringify({event: 'quality.clip', clip: clip.id, level: level.id, bytes: fs.statSync(file).size}));
    }
  }
}

main(process.argv.includes('--real'));
