# PR 1: Blueprint v1 — cheap single-use flex rhinolaryngoscope

Status: in-scope work complete

Branch: `feature/blueprint-v1`

## Goal

Concept blueprint for low-cost single-use flexible rhinolaryngoscope: exploded + assembled teardown drawings (whole scope, distal tip), BOM, cost-down levers, regulatory path. Viewer = standalone `dist/index.html`.

## Implementation Checklist

- [x] Copy teardown skill from bench-bridge (`.agents/skills/teardown`, runtime `tools/teardown`)
- [x] SSOT `drawing/data.json` + `tools/gen.cjs` (derives `drawing.json`, `gen/data.js`; `--check` drift)
- [x] Whole-scope model (`drawing/scope.js`), cord length param 60–300 mm
- [x] Distal-tip model (`drawing/tip.js`)
- [x] `evidence.md` classifies every feature group
- [x] README: target spec vs Ambu Slim, parts table, cost-down levers, regulatory table, build sequence, sources
- [x] `CHROME_PATH` override in `tools/teardown/scripts/commands.cjs` (Chrome not in /Applications)

## Smoke Tests

| Auto check | Result |
|---|---|
| `npm run proof` (12 sheets, min/default/max, spread) | pass, no occlusion WARNING |
| `npm run check` light + `--dark` | pass: scope 11/11 parts, tip 8/8 parts, 0 network requests |

- [x] Walk: open every proof PNG; parts readable, none floating unexplained
- [ ] Walk: viewer exports (SVG/PNG/PDF) open + keep colors — not run
