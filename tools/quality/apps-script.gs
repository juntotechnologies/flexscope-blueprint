// Google Apps Script bound to the answers Sheet ("Flexscope quality test responses", Junto Drive). Manifest: appsscript.json
// (web app, execute as owner, anyone). Deploy: tools/quality/deploy-script.sh; /exec URL → study.json "endpoint".
// One row per trial in "responses"; optional email, 1 row per session, kept apart in "contacts" so response exports hold none.
const SHEET = 'responses';
const CONTACTS = 'contacts';
const HEADER = ['received', 'session', 'startedAt', 'finishedAt', 'phone', 'role', 'setting', 'scopes', 'clip', 'level', 'lesion', 'mobility', 'usable', 'ms', 'skipped', 'screenW', 'screenH', 'pixelRatio'];
const CONTACT_HEADER = ['received', 'session', 'email'];

function sheetWithHeader(book, name, header) {
  const sheet = book.getSheetByName(name) || book.insertSheet(name);
  sheet.getRange(1, 1, 1, header.length).setValues([header]);
  return sheet;
}

function trialRow(received, s, t) {
  const device = s.device || {};
  return [received, s.session, s.startedAt, s.finishedAt, s.phone, s.rater.role, s.rater.setting, s.rater.scopes,
    t.clip, t.level, t.answers.lesion, t.answers.mobility, t.answers.usable, t.ms, t.skipped, device.w, device.h, device.ratio];
}

function appendText(sheet, rows, width) {
  const range = sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, width);
  range.setNumberFormat('@'); // plain text: stops Sheets turning "1-5" / "6-20" into dates
  range.setValues(rows);
}

function saveContact(book, received, s) {
  if (!s.contact) return;
  const sheet = sheetWithHeader(book, CONTACTS, CONTACT_HEADER);
  if (sheet.createTextFinder(s.session).findNext()) return; // resend after a lost reply
  appendText(sheet, [[received, s.session, s.contact.email]], CONTACT_HEADER.length);
}

function save(book, s, received) {
  const rows = s.trials.map(function row(t) { return trialRow(received, s, t); });
  appendText(sheetWithHeader(book, SHEET, HEADER), rows, HEADER.length);
  saveContact(book, received, s);
}

function doPost(e) {
  const s = JSON.parse(e.postData.contents);
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    save(SpreadsheetApp.getActiveSpreadsheet(), s, new Date().toISOString());
  } finally {
    lock.releaseLock();
  }
  return ContentService.createTextOutput('ok');
}
