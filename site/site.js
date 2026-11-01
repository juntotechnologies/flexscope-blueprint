const state = {drawing: 'scope', view: 'exploded'};

function storedTheme() {
  try { return localStorage.getItem('theme'); } catch { return null; }
}

function saveTheme(theme) {
  try { localStorage.setItem('theme', theme); } catch { /* private mode: theme just won't persist */ }
}

function currentTheme() {
  const set = document.documentElement.dataset.theme;
  if (set) return set;
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function toggleTheme() {
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  saveTheme(next);
}

function paint() {
  for (const el of document.querySelectorAll('.sheet')) el.classList.toggle('on', el.dataset.drawing === state.drawing && el.dataset.view === state.view);
  for (const el of document.querySelectorAll('.dwg')) el.classList.toggle('on', el.dataset.drawing === state.drawing);
  for (const key of ['drawing', 'view']) {
    for (const b of document.querySelectorAll(`[data-${key}]:is(button)`)) b.setAttribute('aria-pressed', String(b.dataset[key] === state[key]));
  }
}

function onControl(event) {
  const b = event.target.closest('button[data-drawing], button[data-view]');
  if (!b) return;
  if (b.dataset.drawing) state.drawing = b.dataset.drawing;
  if (b.dataset.view) state.view = b.dataset.view;
  paint();
}

const saved = storedTheme();
if (saved) document.documentElement.dataset.theme = saved;
document.querySelector('.controls').addEventListener('click', onControl);
document.getElementById('theme').addEventListener('click', toggleTheme);
paint();
