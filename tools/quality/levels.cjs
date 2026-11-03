// Pure rules for the survey ladder: every level names a part in cameras.json; the floor = worst real case, expected to fail.
const NEAR_SSIM = 0.02;

function levelIssues(levels, cameras) {
  const known = new Set(cameras.map(function id(c) { return c.id; }));
  const issues = levels.filter(function unknown(l) { return !known.has(l.camera); })
    .map(function say(l) { return `${l.id}: unknown camera ${l.camera}`; });
  const floors = levels.filter(function floor(l) { return l.floor; }).length;
  return floors === 1 ? issues : [...issues, `need exactly 1 floor level, found ${floors}`];
}

function cameraLabel(level, cameras) {
  return cameras.find(function match(c) { return c.id === level.camera; }).part;
}

function parseSsim(ffmpegLog) {
  const match = /All:([0-9.]+)/.exec(ffmpegLog);
  if (!match) throw Error('no SSIM in ffmpeg output');
  return Number(match[1]);
}

function cropSize(crop) {
  return crop ? Number(crop.split(':')[0]) : null;
}

// rows: one clip's levels in study order. A pair too close can't show a quality difference.
function nearPairs(rows) {
  return rows.slice(1).flatMap(function pair(row, i) {
    return Math.abs(rows[i].ssim - row.ssim) < NEAR_SSIM ? [`${rows[i].level}~${row.level}`] : [];
  });
}

module.exports = {levelIssues, cameraLabel, parseSsim, cropSize, nearPairs};
