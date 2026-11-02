// Single-screen page: live teardown drawing (render queue + flipbook from tools/teardown) + tabbed details.
const $ = function byId(id) { return document.getElementById(id); };
const DRAWINGS = JSON.parse($('drawing-data').textContent);
const SHEET = globalThis.TechnicalSheet;
const NS = 'http://www.w3.org/2000/svg';
const PLAY_MS = 700, SLIDER_DELAY = 120, CROP_PAD = 3;
const ZOOM_STEPS = [1, 1.5, 2, 3, 4];
const PHONE = matchMedia('(max-width: 899px)');

const state = {drawing: DRAWINGS[0], explosion: 1, labels: true, crop: null, geometry: null, playing: null, zoom: 0};
const workerBlob = new Blob([JSON.parse($('drawing-worker').textContent)], {type: 'text/javascript'});
const renderer = globalThis.DrawingRenderQueue.create(spawnWorker());
const flipbook = globalThis.DrawingFlipbook.create(spawnWorker, {size: Math.min(Math.max((navigator.hardwareConcurrency || 4) - 2, 2), 6), ease: globalThis.DrawingFlipbook.easeInOutCubic});

function spawnWorker() {
  const url = URL.createObjectURL(workerBlob), worker = new Worker(url);
  URL.revokeObjectURL(url);
  return worker;
}

function message(explosion) {
  const d = state.drawing;
  const params = Object.fromEntries(d.parameters.map(function entry(p) { return [p.key, p.default]; }));
  return {id: d.id, parameters: params, explosion, fitExplosion: 1, isolated: null, fill: true, annotate: state.labels};
}

function flipbookKey() {
  return state.drawing.id + ':' + state.labels;
}

// ---- painting: per-part ink + tint fills (mirrors viewer styleGeometry) ----

function fillMode(el, fills) {
  if (fills.includes(el.dataset.fill)) return 'tint';
  const covers = (el.dataset.covers || '').split(' ');
  return covers.some(function filled(part) { return fills.includes(part); }) ? 'paper' : null;
}

function paintFill(el, d) {
  const mode = fillMode(el, d.fills);
  if (!mode) { el.remove(); return; }
  el.dataset.filled = mode;
  el.style.setProperty('--drawing-ink', d.inks[el.dataset.fill] || d.baseInk);
}

function paint(group, d) {
  group.style.setProperty('--drawing-ink', d.baseInk);
  for (const el of group.querySelectorAll('[data-fill]')) paintFill(el, d);
  for (const el of group.querySelectorAll('[data-item]')) el.style.setProperty('--drawing-ink', d.inks[el.dataset.item] || d.baseInk);
}

// ---- mounting + crop to ink so the drawing fills the pane ----

function mount(markup) {
  const svg = document.createElementNS(NS, 'svg'), group = document.createElementNS(NS, 'g');
  svg.setAttribute('viewBox', state.crop || `0 0 ${SHEET.width} ${SHEET.height}`);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', state.drawing.title + ' · ' + (state.explosion ? 'exploded' : 'assembled') + ' view');
  group.innerHTML = markup;
  paint(group, state.drawing);
  svg.append(group);
  $('drawing').replaceChildren(svg);
  state.geometry = group;
  return svg;
}

function cropTo(svg) {
  const box = svg.firstChild.getBBox();
  state.crop = [box.x - CROP_PAD, box.y - CROP_PAD, box.width + CROP_PAD * 2, box.height + CROP_PAD * 2].map(function fixed(n) { return n.toFixed(2); }).join(' ');
  svg.setAttribute('viewBox', state.crop);
}

// Crop once per drawing+labels at full explosion: every frame shares that fit, so the view never jumps.
async function ensureCrop() {
  if (state.crop) return;
  const result = await renderer.request(message(1));
  cropTo(mount(result.markup));
}

async function render(delay) {
  stopPlayback();
  $('viewport').setAttribute('aria-busy', 'true');
  try {
    await ensureCrop();
    const result = await renderer.request(message(state.explosion), {preview: true, delay});
    if (state.playing) return;
    mount(result.markup);
    $('viewport').setAttribute('aria-busy', 'false');
    flipbook.prepare(flipbookKey(), message(1));
  } catch (error) {
    if (error.name !== 'AbortError') console.error(JSON.stringify({event: 'drawing.render_failed', drawing: state.drawing.id, error: error.message}));
  }
}

// ---- exploded <-> assembled playback ----

function stopPlayback() {
  if (!state.playing) return;
  cancelAnimationFrame(state.playing.frame);
  state.playing = null;
  $('drawing').toggleAttribute('data-playing', false);
}

function playFrame(run, now) {
  run.began ??= now;
  const progress = run.duration ? Math.min(1, (now - run.began) / run.duration) : 1;
  run.value = run.start + (run.end - run.start) * progress;
  state.geometry.innerHTML = run.frames[Math.round(run.value)];
  paint(state.geometry, state.drawing);
  if (progress < 1) run.frame = requestAnimationFrame(function next(t) { playFrame(run, t); });
  else { state.playing = null; $('drawing').toggleAttribute('data-playing', false); render(0); }
}

function play(to) {
  const frames = state.geometry && flipbook.ready(flipbookKey());
  if (!frames || matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  const last = frames.length - 1, start = state.playing?.value ?? state.explosion * last, end = to * last;
  if (state.playing) cancelAnimationFrame(state.playing.frame);
  const run = {frames, start, end, value: start, began: null, duration: PLAY_MS * Math.abs(end - start) / last, frame: 0};
  state.playing = run;
  $('drawing').toggleAttribute('data-playing', true);
  run.frame = requestAnimationFrame(function first(t) { playFrame(run, t); });
  return true;
}

// ---- controls ----

function syncControls() {
  const view = state.explosion === 0 ? 'assembled' : 'exploded';
  for (const b of $('view').children) b.setAttribute('aria-pressed', String(b.dataset.view === view));
  for (const b of $('drawing-tabs').children) b.setAttribute('aria-selected', String(b.dataset.drawing === state.drawing.id));
  $('spacing').value = Math.round(state.explosion * 100);
  $('labels').setAttribute('aria-pressed', String(state.labels));
  $('dwg').innerHTML = state.drawing.dwgHtml;
}

function setView(event) {
  const b = event.target.closest('[data-view]');
  if (!b) return;
  const to = b.dataset.view === 'assembled' ? 0 : 1;
  const animated = play(to);
  state.explosion = to;
  syncControls();
  if (!animated) render(0);
}

function setSpacing() {
  state.explosion = Number($('spacing').value) / 100;
  syncControls();
  render(SLIDER_DELAY);
}

function toggleLabels() {
  state.labels = !state.labels;
  state.crop = null;
  syncControls();
  render(0);
}

function setDrawing(event) {
  const b = event.target.closest('[data-drawing]');
  if (!b || b.dataset.drawing === state.drawing.id) return;
  state.drawing = DRAWINGS.find(function match(d) { return d.id === b.dataset.drawing; });
  state.explosion = state.drawing.initialView === 'assembled' ? 0 : 1;
  state.crop = null;
  applyZoom(0);
  syncControls();
  render(0);
}

// ---- zoom: scales the drawing inside the viewport; the viewport scrolls, the page never does ----

function viewCenter(viewport) {
  return [(viewport.scrollLeft + viewport.clientWidth / 2) / viewport.scrollWidth, (viewport.scrollTop + viewport.clientHeight / 2) / viewport.scrollHeight];
}

function applyZoom(index) {
  const viewport = $('viewport'), center = viewCenter(viewport), zoom = ZOOM_STEPS[index];
  state.zoom = index;
  $('drawing').style.setProperty('--zoom', zoom);
  viewport.toggleAttribute('data-zoomed', zoom > 1);
  viewport.scrollLeft = center[0] * viewport.scrollWidth - viewport.clientWidth / 2;
  viewport.scrollTop = center[1] * viewport.scrollHeight - viewport.clientHeight / 2;
  $('zoom-level').value = Math.round(zoom * 100) + '%';
  $('zoom').querySelector('[data-zoom="-1"]').disabled = index === 0;
  $('zoom').querySelector('[data-zoom="1"]').disabled = index === ZOOM_STEPS.length - 1;
}

function onZoom(event) {
  const b = event.target.closest('[data-zoom]');
  if (!b) return;
  const step = Number(b.dataset.zoom);
  applyZoom(step === 0 ? 0 : Math.max(0, Math.min(ZOOM_STEPS.length - 1, state.zoom + step)));
}

// ---- tabs, panes, theme ----

function selectTab(event) {
  const tab = event.target.closest('[role=tab]');
  if (!tab) return;
  for (const t of $('detail-tabs').children) t.setAttribute('aria-selected', String(t === tab));
  for (const p of document.querySelectorAll('.tab-panel')) p.hidden = p.id !== tab.getAttribute('aria-controls');
}

function selectPane(id) {
  $('panes').dataset.pane = id;
  for (const b of $('dock').children) b.setAttribute('aria-pressed', String(b.dataset.pane === id));
}

function onDock(event) {
  const b = event.target.closest('[data-pane]');
  if (b) selectPane(b.dataset.pane);
}

function storedTheme() {
  try { return localStorage.getItem('theme'); } catch { return null; }
}

function saveTheme(theme) {
  try { localStorage.setItem('theme', theme); } catch { /* private mode: theme just won't persist */ }
}

function toggleTheme() {
  const set = document.documentElement.dataset.theme;
  const current = set || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  saveTheme(next);
}

function start() {
  const saved = storedTheme();
  if (saved) document.documentElement.dataset.theme = saved;
  $('theme').addEventListener('click', toggleTheme);
  $('view').addEventListener('click', setView);
  $('spacing').addEventListener('input', setSpacing);
  $('labels').addEventListener('click', toggleLabels);
  $('drawing-tabs').addEventListener('click', setDrawing);
  $('detail-tabs').addEventListener('click', selectTab);
  $('dock').addEventListener('click', onDock);
  $('zoom').addEventListener('click', onZoom);
  applyZoom(0);
  selectPane(location.hash === '#details' && PHONE.matches ? 'details' : 'drawing');
  syncControls();
  render(0);
}

start();
