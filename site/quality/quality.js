// Quality test: each rater sees every clip once; levels rotate across clips from a random offset
// (Latin square), so no rater sees one case twice and every level gets equal use across raters.
const $ = function byId(id) { return document.getElementById(id); };
const STUDY = JSON.parse($('study').textContent);
const BACKUP_PREFIX = 'quality-submission-';

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
  run.shownAt = 0;
  $('video').src = `${STUDY.clipBase}${t.clip}-${t.level}.mp4`;
  show('trial');
}

// Time per trial starts when the clip actually plays, so slow loads don't count.
function onPlaying() {
  if (!run.shownAt) run.shownAt = performance.now();
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
  t.ms = run.shownAt ? Math.round(performance.now() - run.shownAt) : null;
  run.index += 1;
  if (run.index < run.trials.length) loadTrial();
  else submit();
}

function payload() {
  return {session: run.session, startedAt: run.startedAt, finishedAt: new Date().toISOString(), phone: matchMedia('(max-width: 600px)').matches, rater: run.rater, trials: run.trials};
}

function backup(body) {
  try { localStorage.setItem(BACKUP_PREFIX + run.session, body); } catch { /* private mode: no local copy */ }
}

function clearBackup() {
  try { localStorage.removeItem(BACKUP_PREFIX + run.session); } catch { /* nothing kept */ }
}

// text/plain keeps it a simple request (no preflight); the Apps Script reply is readable, so check it says ok.
async function send(body) {
  const response = await fetch(STUDY.endpoint, {method: 'POST', headers: {'content-type': 'text/plain;charset=utf-8'}, body, keepalive: body.length < 60000});
  if ((await response.text()).trim() !== 'ok') throw Error('endpoint did not confirm');
}

async function deliver(body) {
  $('retry').hidden = true;
  $('done-text').textContent = 'Sending your answers…';
  try {
    await send(body);
    clearBackup();
    $('done-text').textContent = 'Your answers were sent.';
  } catch (error) {
    $('done-text').textContent = 'Could not send your answers. Check your connection, then tap Send again. Please keep this page open.';
    $('retry').hidden = false;
    console.error(JSON.stringify({event: 'quality.submit_failed', session: run.session, error: error.message}));
  }
}

function submit() {
  const body = JSON.stringify(payload());
  globalThis.qualityLastSubmission = body;
  backup(body);
  $('video').removeAttribute('src');
  show('done');
  if (!STUDY.endpoint) { $('done-text').textContent = 'Preview mode: answers were not sent.'; return; }
  deliver(body);
}

function retry() {
  deliver(globalThis.qualityLastSubmission);
}

function onGo(event) {
  const b = event.target.closest('[data-go]');
  if (b) show(b.dataset.go);
}

function start() {
  $('preview-note').hidden = Boolean(STUDY.endpoint);
  $('quiz').addEventListener('click', onGo);
  $('rater-form').addEventListener('change', onRaterInput);
  $('trial-form').addEventListener('change', onTrialInput);
  $('rater-next').addEventListener('click', startTrials);
  $('trial-next').addEventListener('click', nextTrial);
  $('video').addEventListener('playing', onPlaying);
  $('retry').addEventListener('click', retry);
  show('intro');
}

start();
