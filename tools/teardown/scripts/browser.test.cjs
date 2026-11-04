const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const {ENV_VAR, browserOptions, launchBrowser} = require('./browser.cjs');

const APP_BINARY = '/Applications/Any.app/Contents/MacOS/Any';
const TOOLS = path.resolve(__dirname, '../..');

function recordingLauncher(result = 'browser') {
  const calls = [];
  return {calls, launch: async options => { calls.push(options); return result; }};
}

function sourceFiles(dir) {
  return fs.readdirSync(dir, {withFileTypes: true}).flatMap(entry => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === 'sources' ? [] : sourceFiles(file);
    return /\.cjs$/.test(entry.name) ? [file] : [];
  });
}

test('default is Playwright\'s own headless shell: no executable path', () => {
  assert.deepEqual(browserOptions({}), {});
  assert.deepEqual(browserOptions({[ENV_VAR]: ''}), {});
});

test('an executable override that is not an app is passed through', () => {
  assert.deepEqual(browserOptions({[ENV_VAR]: '/x/chrome-headless-shell'}), {executablePath: '/x/chrome-headless-shell'});
});

test('an app bundle override is refused: every launch adds a Dock tile', () => {
  assert.throws(() => browserOptions({[ENV_VAR]: APP_BINARY}), /Dock tile.*Unset SHOT_CHROME_PATH/);
});

test('the old CHROME_PATH variable is ignored', () => {
  assert.deepEqual(browserOptions({CHROME_PATH: APP_BINARY}), {});
});

test('launchBrowser launches headless with the resolved options', async () => {
  const launcher = recordingLauncher();
  assert.equal(await launchBrowser({}, launcher), 'browser');
  assert.deepEqual(launcher.calls, [{}]);
});

test('launchBrowser refuses an app override before launching anything', async () => {
  const launcher = recordingLauncher();
  await assert.rejects(launchBrowser({[ENV_VAR]: APP_BINARY}, launcher), /Dock tile/);
  assert.deepEqual(launcher.calls, []);
});

test('a missing headless shell says how to install it', async () => {
  const missing = {launch: async () => { throw Error("browserType.launch: Executable doesn't exist at /x"); }};
  await assert.rejects(launchBrowser({}, missing), /npm run browser:install/);
});

test('other launch failures pass through unchanged', async () => {
  const broken = {launch: async () => { throw Error('boom'); }};
  await assert.rejects(launchBrowser({}, broken), /^Error: boom$/);
});

test('browser.cjs is the only tool file that launches a browser or picks its executable', () => {
  const owners = ['browser.cjs', 'browser.test.cjs'];
  const strays = sourceFiles(TOOLS).filter(file => !owners.includes(path.basename(file)) && /\.launch\(|executablePath|CHROME_PATH/.test(fs.readFileSync(file, 'utf8')));
  assert.deepEqual(strays.map(file => path.relative(TOOLS, file)), []);
});
