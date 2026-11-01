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

## Site (added 2026-11-01, Shaun asked: deploy as site, mobile-friendly like bench-bridge, repo public)

- [x] `site/` template + CSS (bench-bridge tokens: paper, ink, accent, Plex Mono, 44 px taps) + JS (drawing/view toggles, theme)
- [x] `tools/site/build.cjs`: README.md (SSOT) → page; tables → stacked cards ≤640 px; drawing SVGs inlined (theme ink); viewer at `viewer/`
- [x] `tools/site/serve.cjs` (`npm run dev`, tailnet link) + `tools/site/shot.cjs` (5 viewports, fails on overflow/page error)
- [x] `.github/workflows/pages.yml` → GitHub Pages at flexscope.juntotechnologies.com (Pages custom domain set; needs DNS CNAME flexscope → juntotechnologies.github.io)

| Auto check | Result |
|---|---|
| `shot.cjs` site, 360/390/844/768/1366 | 0 overflow, 0 page errors |
| `shot.cjs` viewer, same viewports | 0 overflow, 0 page errors |

- [x] Walk: phone 390 light + dark; drawing/view toggles swap sheet; tables readable as cards
