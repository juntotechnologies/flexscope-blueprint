// Part hue (deg) → hex ink, same OKLCH formula + constants as tools/teardown/assets/viewer.js (constants read from that file).
const fs = require('node:fs'), path = require('node:path');

const VIEWER = fs.readFileSync(path.join(__dirname, '../teardown/assets/viewer.js'), 'utf8');
const [, LIGHTNESS, MAX_CHROMA] = VIEWER.match(/HUE_INK = \{lightness: ([\d.]+), maxChroma: ([\d.]+)\}/).map(Number);
const [, GRAPHITE] = VIEWER.match(/GRAPHITE = '(#[0-9a-f]{6})'/);

function linearRgb(hue, chroma) {
  const angle = hue * Math.PI / 180, a = chroma * Math.cos(angle), b = chroma * Math.sin(angle);
  const l = (LIGHTNESS + .3963377774 * a + .2158037573 * b) ** 3;
  const m = (LIGHTNESS - .1055613458 * a - .0638541728 * b) ** 3;
  const s = (LIGHTNESS - .0894841775 * a - 1.291485548 * b) ** 3;
  return [4.0767416621 * l - 3.3077115913 * m + .2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - .3413193965 * s, -.0041960863 * l - .7034186147 * m + 1.707614701 * s];
}

function inGamut(rgb) {
  return rgb.every(function ok(x) { return x >= -1e-4 && x <= 1 + 1e-4; });
}

function maxChroma(hue) {
  let low = 0, high = MAX_CHROMA;
  for (let i = 0; i < 20; i++) {
    const chroma = (low + high) / 2;
    if (inGamut(linearRgb(hue, chroma))) low = chroma;
    else high = chroma;
  }
  return low;
}

function channelHex(x) {
  const v = x <= .0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - .055;
  return Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0');
}

function inkFromHue(hue) {
  return '#' + linearRgb(hue, maxChroma(hue)).map(channelHex).join('');
}

module.exports = {inkFromHue, GRAPHITE};
