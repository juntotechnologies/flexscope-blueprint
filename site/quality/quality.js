// Quality test: each rater sees every clip once; levels rotate across clips from a random offset
// (Latin square), so no rater sees one case twice and every level gets equal use across raters.
const $ = function byId(id) { return document.getElementById(id); };
const STUDY = JSON.parse($('study').textContent);
const BACKUP_KEY = 'quality-submission';

const run = {session: sessionId(), startedAt: new Date().toISOString(), rater: {}, trials: assignTrials(STUDY.clips, STUDY.levels, Math.random), index: 0, shownAt: 0};

function sessionId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

function shuffle(items, random) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function assignTrials(clips, levels, random) {
  const offset = Math.floor(random() * levels.length);
  const trials = clips.map(function trial(clip, i) { return {clip: clip.id, level: levels[(i + offset) % levels.length].id, answers: {}, ms: 0}; });
  return shuffle(trials, random);
}

function formAnswers(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function complete(form, fields) {
  const answers = formAnswers(form);
  return fields.every(function answered(field) { return field.id in answers; });
}

function show(screen) {
  $('quiz').dataset.screen = screen;
  const trial = screen === 'trial' ? `${run.index + 1} / ${run.trials.length}` : '';
  $('step').textContent = trial;
  scrollTo(0, 0);
}

function loadTrial() {
  const t = run.trials[run.index];
  $('trial-form').reset();
  $('trial-next').disabled = true;
  $('video').src = `${STUDY.clipBase}${t.clip}-${t.level}.mp4`;
  run.shownAt = performance.now();
  show('trial');
}

function onRaterInput() {
  $('rater-next').disabled = !complete($('rater-form'), STUDY.rater);
}

function onTrialInput() {
  $('trial-next').disabled = !complete($('trial-form'), STUDY.questions);
}

function startTrials() {
  run.rater = formAnswers($('rater-form'));
  loadTrial();
}

function nextTrial() {
  const t = run.trials[run.index];
  t.answers = formAnswers($('trial-form'));
  t.ms = Math.round(performance.now() - run.shownAt);
  run.index += 1;
  if (run.index < run.trials.length) loadTrial();
  else submit();
}

function payload() {
  return {session: run.session, startedAt: run.startedAt, finishedAt: new Date().toISOString(), phone: matchMedia('(max-width: 600px)').matches, rater: run.rater, trials: run.trials};
}

function backup(body) {
  try { localStorage.setItem(BACKUP_KEY, body); } catch { /* private mode: no local copy */ }
}

// Apps Script web apps answer without CORS headers, so the post is fire-and-forget (no-cors, text/plain).
async function send(body) {
  await fetch(STUDY.endpoint, {method: 'POST', mode: 'no-cors', headers: {'content-type': 'text/plain;charset=utf-8'}, body});
}

async function submit() {
  const body = JSON.stringify(payload());
  globalThis.qualityLastSubmission = body;
  backup(body);
  $('video').removeAttribute('src');
  show('done');
  if (!STUDY.endpoint) { $('done-text').textContent = 'Preview mode: answers were not sent.'; return; }
  try { await send(body); } catch (error) {
    $('done-text').textContent = 'Could not send answers. Please check your connection and reload; your answers are kept on this device.';
    console.error(JSON.stringify({event: 'quality.submit_failed', session: run.session, error: error.message}));
  }
}

function onGo(event) {
  const b = event.target.closest('[data-go]');
  if (b) show(b.dataset.go);
}

function start() {
  $('demo-note').hidden = !STUDY.clips.some(function demo(c) { return c.demo; });
  $('preview-note').hidden = Boolean(STUDY.endpoint);
  $('quiz').addEventListener('click', onGo);
  $('rater-form').addEventListener('change', onRaterInput);
  $('trial-form').addEventListener('change', onTrialInput);
  $('rater-next').addEventListener('click', startTrials);
  $('trial-next').addEventListener('click', nextTrial);
  show('intro');
}

start();
