// Build mode shared by build.cjs + make-clips.cjs: public (open clips → study.out) or `--real` (private clips → study.privateOut).
const path = require('node:path');
const study = require('./study.json');

const root = path.resolve(__dirname, '../..');

function buildMode(argv) {
  const real = argv.includes('--real');
  const source = real ? 'private' : 'open';
  return {source, out: path.join(root, real ? study.privateOut : study.out), clips: study.clips.filter(function inMode(c) { return c.source === source; })};
}

module.exports = {buildMode};
