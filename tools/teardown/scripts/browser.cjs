// The one place that starts a browser. No executable path = Playwright's own headless shell, which never gets a Dock tile.
const {chromium} = require('playwright-core');

const ENV_VAR = 'SHOT_CHROME_PATH';
const APP_BUNDLE_MARKER = '.app/Contents/MacOS/';
const MISSING_BROWSER = /Executable doesn't exist/;

function browserOptions(env) {
  const executable = env[ENV_VAR] || '';
  if (executable.includes(APP_BUNDLE_MARKER)) throw Error(`${executable} is an app: every launch adds a Dock tile. Unset ${ENV_VAR}.`);
  return executable ? {executablePath: executable} : {};
}

function rethrowExplained(error) {
  if (!MISSING_BROWSER.test(error.message)) throw error;
  throw Error('Playwright headless shell is not installed: run npm run browser:install', {cause: error});
}

async function launchBrowser(env = process.env, launcher = chromium) {
  const options = browserOptions(env);
  return launcher.launch(options).catch(rethrowExplained);
}

module.exports = {ENV_VAR, browserOptions, launchBrowser};
