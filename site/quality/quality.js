// Quality test: each rater sees every clip once; levels rotate across clips from a random offset
// (Latin square), so no rater sees one case twice and every level gets equal use across raters.
const $ = function byId(id) { return document.getElementById(id); };
const STUDY = JSON.parse($('study').textContent);
// ?preview (or no endpoint): full run, nothing sent. Used by site walks and for trying the test.
const PREVIEW = !STUDY.endpoint || new URLSearchParams(location.search).has('preview');

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
  const trials = clips.map(function trial(clip, i) { return {clip: clip.id, level: levels[(i + offset) % levels.length].id, answers: {}, ms: 0, skipped: false}; });
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

// Questions stay locked until the clip plays, so nobody answers a black box.
function loadTrial() {
  const t = run.trials[run.index];
  $('trial-form').reset();
  $('trial-form').inert = true;
  $('trial-next').disabled = true;
  $('tap-play').hidden = true;
  $('clip-error').hidden = true;
  run.shownAt = 0;
  $('video').src = `${STUDY.clipBase}${t.clip}-${t.level}.mp4`;
  show('trial');
  playClip();
}

// Autoplay can be blocked (iOS Low Power Mode): offer a tap instead.
function playClip() {
  $('video').play().catch(showTapPlay);
}

function showTapPlay() {
  if (!run.shownAt) $('tap-play').hidden = false;
}

function onTapPlay() {
  $('tap-play').hidden = true;
  playClip();
}

// Time per trial starts when the clip actually plays, so slow loads don't count.
function onPlaying() {
  $('tap-play').hidden = true;
  $('trial-form').inert = false;
  if (!run.shownAt) run.shownAt = performance.now();
}

function onVideoError() {
  const t = run.trials[run.index];
  $('clip-error').hidden = false;
  console.error(JSON.stringify({event: 'quality.clip_failed', session: run.session, clip: t.clip, level: t.level, code: $('video').error?.code}));
}

function skipClip() {
  run.trials[run.index].skipped = true;
  run.trials[run.index].ms = null;
  advance();
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
  advance();
}

function advance() {
  run.index += 1;
  if (run.index < run.trials.length) loadTrial();
  else submit();
}

function payload() {
  return {session: run.session, startedAt: run.startedAt, finishedAt: new Date().toISOString(), phone: matchMedia('(max-width: 600px)').matches, rater: run.rater, trials: run.trials};
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
  $('video').removeAttribute('src');
  show('done');
  if (PREVIEW) { $('done-text').textContent = 'Preview mode: answers were not sent.'; return; }
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
  $('preview-note').hidden = !PREVIEW;
  $('quiz').addEventListener('click', onGo);
  $('rater-form').addEventListener('change', onRaterInput);
  $('trial-form').addEventListener('change', onTrialInput);
  $('rater-next').addEventListener('click', startTrials);
  $('trial-next').addEventListener('click', nextTrial);
  $('video').addEventListener('playing', onPlaying);
  $('video').addEventListener('error', onVideoError);
  $('tap-play').addEventListener('click', onTapPlay);
  $('skip-clip').addEventListener('click', skipClip);
  $('retry').addEventListener('click', retry);
  show('intro');
}

start();
