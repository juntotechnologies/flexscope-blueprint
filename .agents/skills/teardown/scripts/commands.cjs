const {execFileSync} = require('node:child_process');

function has(command) {
  try {
    execFileSync('which', [command], {stdio: 'ignore'});
    return true;
  } catch {
    return false;
  }
}

module.exports = {has};
