// Runs apps-script.gs against a small fake Sheet: Apps Script itself only runs on Google's side.
const test = require('node:test'), assert = require('node:assert'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');

class FakeRange {
  constructor(sheet, row) { this.sheet = sheet; this.row = row; }
  setNumberFormat() { return this; }
  setValues(rows) { rows.forEach(function put(r, i) { this.sheet.rows[this.row - 1 + i] = r; }, this); return this; }
}

class FakeSheet {
  constructor() { this.rows = []; }
  getRange(row) { return new FakeRange(this, row); }
  getLastRow() { return this.rows.length; }
  createTextFinder(text) {
    const found = this.rows.some(function has(r) { return r.includes(text); });
    return {findNext: function next() { return found; }};
  }
}

class FakeBook {
  constructor() { this.sheets = {}; }
  getSheetByName(name) { return this.sheets[name]; }
  insertSheet(name) { this.sheets[name] = new FakeSheet(); return this.sheets[name]; }
}

function loadScript() {
  const context = {};
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, 'apps-script.gs'), 'utf8') + '\nthis.save = save;', context);
  return context;
}

const BASE = {session: 's1', startedAt: 't', finishedAt: 't', phone: true, device: {w: 390, h: 844, ratio: 3}, rater: {role: 'r', setting: 's', scopes: '1-5'},
  trials: [{clip: 'k7', level: 'q720', answers: {lesion: 'No', mobility: 'Both move', usable: '4'}, ms: 1, skipped: false}, {clip: 'm2', level: 'q64', answers: {}, ms: 2, skipped: false}]};

test('email goes to contacts once, never to responses', function once() {
  const book = new FakeBook(), {save} = loadScript();
  const s = {...BASE, contact: {email: 'a@b.co'}};
  save(book, s, 'now');
  save(book, s, 'later');
  assert.strictEqual(book.sheets.contacts.rows.length, 2);
  assert.strictEqual(book.sheets.contacts.rows[1][2], 'a@b.co');
  assert.ok(!JSON.stringify(book.sheets.responses.rows).includes('a@b.co'));
});

test('no email: trials saved, no contacts row', function none() {
  const book = new FakeBook(), {save} = loadScript();
  save(book, BASE, 'now');
  assert.strictEqual(book.sheets.responses.rows.length, 3);
  assert.strictEqual(book.sheets.contacts, undefined);
});

test('device columns line up with header', function device() {
  const book = new FakeBook(), {save} = loadScript();
  save(book, BASE, 'now');
  const [head, row] = book.sheets.responses.rows;
  assert.strictEqual(row[head.indexOf('screenW')], 390);
  assert.strictEqual(row[head.indexOf('pixelRatio')], 3);
  assert.strictEqual(row.length, head.length);
});

test('old page with no device still saves', function oldPage() {
  const book = new FakeBook(), {save} = loadScript();
  save(book, {...BASE, device: undefined}, 'now');
  assert.strictEqual(book.sheets.responses.rows.length, 3);
});

test('email-only post adds a contact, no trial rows', function emailOnly() {
  const book = new FakeBook(), {save} = loadScript();
  save(book, BASE, 'now');
  save(book, {session: 's1', contact: {email: 'a@b.co'}, trials: []}, 'later');
  assert.strictEqual(book.sheets.responses.rows.length, 3);
  assert.strictEqual(book.sheets.contacts.rows[1][2], 'a@b.co');
});
