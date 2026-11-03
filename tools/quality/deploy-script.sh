#!/bin/bash
# Push apps-script.gs to the live Apps Script, keep the same /exec URL. Dry run by default; --apply deploys.
# Signs in with clasp if needed (browser), signs out after so no token stays on this Mac.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SCRIPT_ID="$(node -p "require('$ROOT/tools/quality/study.json').scriptId")"
DEPLOYMENT="$(node -p "require('$ROOT/tools/quality/study.json').endpoint.split('/s/')[1].split('/')[0]")"
if [ "${1:-}" != "--apply" ]; then
  echo "dry run: would push tools/quality/apps-script.gs + appsscript.json to script $SCRIPT_ID, update deployment $DEPLOYMENT. Add --apply."
  exit 0
fi
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
cp "$ROOT/tools/quality/apps-script.gs" "$WORK/Code.gs"
cp "$ROOT/tools/quality/appsscript.json" "$WORK/appsscript.json"
echo "{\"scriptId\": \"$SCRIPT_ID\", \"rootDir\": \".\"}" > "$WORK/.clasp.json"
cd "$WORK"
CLASP=(npx --yes @google/clasp@3.4.1)
"${CLASP[@]}" login
"${CLASP[@]}" push --force
"${CLASP[@]}" update-deployment "$DEPLOYMENT" --description "quality test contact"
"${CLASP[@]}" logout
echo '{"event":"quality.script_deployed"}'
