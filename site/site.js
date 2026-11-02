// Single-screen page: live teardown drawing (render queue from tools/teardown) + tabbed details.
// Motion = slide each part's rendered ink (model returns per-part slides); exact render replaces it at rest.
const $ = function byId(id) { return document.getElementById(id); };
const DRAWINGS = JSON.parse($('drawing-data').textContent);
const SHEET = globalThis.TechnicalSheet;
const NS = 'http://www.w3.org/2000/svg';
const PLAY_MS = 700, SLIDER_DELAY = 120, CROP_PAD = 3;
const ZOOM_STEPS = [1, 1.5, 2, 3, 4];
const PHONE = matchMedia('(max-width: 899px)');

const state = {drawing: DRAWINGS[0], explosion: 1, labels: true, crop: null, base: null, geometry: null, playing: null, zoom: 0};
const workerBlob = new Blob([JSON.parse($('drawing-worker').textContent)], {type: 'text/javascript'});
const renderer = globalThis.DrawingRenderQueue.create(spawnWorker());

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

function renderKey() {
  return state.drawing.id + ':' + state.labels;
}

function resetBase() {
  state.crop = null;
  state.base = null;
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
  $('drawing').toggleAttribute('data-playing', false);
  state.geometry = group;
  return svg;
}

function cropTo(svg) {
  const box = svg.firstChild.getBBox();
  state.crop = [box.x - CROP_PAD, box.y - CROP_PAD, box.width + CROP_PAD * 2, box.height + CROP_PAD * 2].map(function fixed(n) { return n.toFixed(2); }).join(' ');
  svg.setAttribute('viewBox', state.crop);
}

function superseded() {
  const error = new Error('Drawing changed during render');
  error.name = 'AbortError';
  return error;
}

// getBBox needs a rendered svg: a hidden pane (phone on Details) measures 0x0, so crop waits until the pane shows.
function drawingVisible() {
  return $('pane-drawing').checkVisibility();
}

// Crop + base once per drawing+labels at full explosion: every render shares that fit, so the view never jumps.
async function ensureBase() {
  if (state.base || !drawingVisible()) return;
  const key = renderKey(), result = await renderer.request(message(1));
  if (key !== renderKey()) throw superseded();
  state.base = {markup: result.markup, slides: result.slides};
  cropTo(mount(result.markup));
}

function setBusy(busy) {
  $('viewport').setAttribute('aria-busy', String(busy));
}

async function render(delay) {
  setBusy(true);
  try {
    await ensureBase();
    const key = renderKey(), result = await renderer.request(message(state.explosion), {preview: true, delay});
    if (key !== renderKey()) return;
    setBusy(false);
    if (state.playing) return;
    mount(result.markup);
  } catch (error) {
    if (error.name === 'AbortError') return;
    setBusy(false);
    if (state.base) mount(state.base.markup);
    console.error(JSON.stringify({event: 'drawing.render_failed', drawing: state.drawing.id, error: error.message}));
  }
}

// ---- motion: slide base ink (rendered at explosion 1) by slide × (e − 1) ----

function showBase() {
  if (!state.base) return false;
  if (!state.geometry?.dataset.base) mount(state.base.markup).firstChild.dataset.base = '1';
  return true;
}

function slideTo(explosion) {
  if (!showBase()) return;
  const k = explosion - 1, slides = state.base.slides;
  for (const el of state.geometry.querySelectorAll('[data-item], [data-fill]')) {
    const s = slides[el.dataset.item ?? el.dataset.fill];
    if (s) el.setAttribute('transform', `translate(${(s[0] * k).toFixed(3)} ${(s[1] * k).toFixed(3)})`);
  }
  $('drawing').toggleAttribute('data-playing', true);
}

function easeInOutCubic(t) {
  return t < .5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
}

function stopPlayback() {
  if (!state.playing) return;
  cancelAnimationFrame(state.playing.frame);
  state.playing = null;
}

function playFrame(run, now) {
  run.began ??= now;
  const t = run.duration ? Math.min(1, (now - run.began) / run.duration) : 1;
  run.value = run.from + (run.to - run.from) * easeInOutCubic(t);
  slideTo(run.value);
  if (t < 1) { run.frame = requestAnimationFrame(playFrame.bind(null, run)); return; }
  state.playing = null;
  render(0);
}

function play(to) {
  if (!state.base || matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  const from = state.playing?.value ?? state.explosion;
  stopPlayback();
  const run = {from, to, value: from, began: null, duration: PLAY_MS * Math.abs(to - from), frame: 0};
  state.playing = run;
  run.frame = requestAnimationFrame(playFrame.bind(null, run));
  return true;
}

// ---- controls ----

function syncControls() {
  const view = state.explosion === 0 ? 'assembled' : 'exploded';
  for (const b of $('view').children) b.setAttribute('aria-pressed', String(b.dataset.view === view));
  for (const b of $('drawing-tabs').children) b.setAttribute('aria-pressed', String(b.dataset.drawing === state.drawing.id));
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
  stopPlayback();
  state.explosion = Number($('spacing').value) / 100;
  syncControls();
  slideTo(state.explosion);
  render(SLIDER_DELAY);
}

function toggleLabels() {
  stopPlayback();
  state.labels = !state.labels;
  resetBase();
  syncControls();
  render(0);
}

function setDrawing(event) {
  const b = event.target.closest('[data-drawing]');
  if (!b || b.dataset.drawing === state.drawing.id) return;
  stopPlayback();
  state.drawing = DRAWINGS.find(function match(d) { return d.id === b.dataset.drawing; });
  state.explosion = state.drawing.initialView === 'assembled' ? 0 : 1;
  resetBase();
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

// WAI-ARIA tabs: roving tabindex, arrows/Home/End move + select.
const TAB_KEYS = {ArrowRight: 1, ArrowLeft: -1, Home: -Infinity, End: Infinity};

function showTab(tab) {
  for (const t of $('detail-tabs').children) {
    t.setAttribute('aria-selected', String(t === tab));
    t.tabIndex = t === tab ? 0 : -1;
  }
  for (const p of document.querySelectorAll('.tab-panel')) p.hidden = p.id !== tab.getAttribute('aria-controls');
}

function selectTab(event) {
  const tab = event.target.closest('[role=tab]');
  if (tab) showTab(tab);
}

function tabKey(event) {
  if (!(event.key in TAB_KEYS)) return;
  event.preventDefault();
  const tabs = [...$('detail-tabs').children], current = tabs.indexOf(document.activeElement);
  const step = TAB_KEYS[event.key], index = Number.isFinite(step) ? (current + step + tabs.length) % tabs.length : (step < 0 ? 0 : tabs.length - 1);
  showTab(tabs[index]);
  tabs[index].focus();
}

function selectPane(id) {
  $('panes').dataset.pane = id;
  for (const b of $('dock').children) b.setAttribute('aria-pressed', String(b.dataset.pane === id));
  if (id === 'drawing' && !state.base) render(0);
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
  $('detail-tabs').addEventListener('keydown', tabKey);
  showTab($('detail-tabs').firstElementChild);
  $('dock').addEventListener('click', onDock);
  $('zoom').addEventListener('click', onZoom);
  applyZoom(0);
  syncControls();
  selectPane(location.hash === '#details' && PHONE.matches ? 'details' : 'drawing');
}

start();
