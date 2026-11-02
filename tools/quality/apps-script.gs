// Google Apps Script bound to the answers Sheet ("Flexscope quality test responses", Junto Drive). Manifest: appsscript.json
// (web app, execute as owner, anyone). Deploy: clasp push + clasp create-deployment; /exec URL → study.json "endpoint".
// One row per trial; analysis lives in tools/quality/analyze.cjs.
const SHEET = 'responses';
const HEADER = ['received', 'session', 'startedAt', 'finishedAt', 'phone', 'role', 'setting', 'scopes', 'clip', 'level', 'lesion', 'mobility', 'usable', 'ms', 'skipped'];

function responsesSheet() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = book.getSheetByName(SHEET) || book.insertSheet(SHEET);
  if (sheet.getLastRow() === 0) sheet.appendRow(HEADER);
  return sheet;
}

function trialRow(received, s, t) {
  return [received, s.session, s.startedAt, s.finishedAt, s.phone, s.rater.role, s.rater.setting, s.rater.scopes,
    t.clip, t.level, t.answers.lesion, t.answers.mobility, t.answers.usable, t.ms, t.skipped];
}

function doPost(e) {
  const s = JSON.parse(e.postData.contents), received = new Date().toISOString();
  const rows = s.trials.map(function row(t) { return trialRow(received, s, t); });
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sheet = responsesSheet();
    const range = sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, HEADER.length);
    range.setNumberFormat('@'); // plain text: stops Sheets turning "1-5" / "6-20" into dates
    range.setValues(rows);
  } finally {
    lock.releaseLock();
  }
  return ContentService.createTextOutput('ok');
}
