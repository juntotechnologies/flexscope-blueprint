#!/usr/bin/env node
// Serve dist-site/ on all interfaces under the Pages base path; print the tailnet link only.
const http = require('node:http'), fs = require('node:fs'), path = require('node:path'), {execFileSync} = require('node:child_process');

const root = path.resolve(__dirname, '../../dist-site');
const base = new URL(require('../../site/site.json').url).pathname;
const PORT = Number(process.env.PORT || 4321);
const TYPES = {'.html': 'text/html; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.txt': 'text/plain', '.mp4': 'video/mp4'};

function tailnetHost() {
  try {
    const status = JSON.parse(execFileSync('tailscale', ['status', '--json'], {encoding: 'utf8'}));
    return status.Self.DNSName.replace(/\.$/, '');
  } catch { return 'localhost'; }
}

function resolveFile(urlPath) {
  if (!urlPath.startsWith(base)) return null;
  const rel = decodeURIComponent(urlPath.slice(base.length)).replace(/\/$/, '/index.html') || 'index.html';
  const file = path.join(root, rel);
  return file.startsWith(root) && fs.existsSync(file) && fs.statSync(file).isFile() ? file : null;
}

function handle(req, res) {
  const urlPath = new URL(req.url, 'http://x').pathname;
  if (urlPath !== base && (urlPath === base.replace(/\/$/, '') || urlPath === '/')) { res.writeHead(302, {location: base}); return res.end(); }
  const file = resolveFile(urlPath);
  if (!file) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, {'content-type': TYPES[path.extname(file)] || 'application/octet-stream'});
  fs.createReadStream(file).pipe(res);
}

http.createServer(handle).listen(PORT, '0.0.0.0', function ready() { console.log(`http://${tailnetHost()}:${PORT}${base}`); });
