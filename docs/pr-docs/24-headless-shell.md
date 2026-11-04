# PR 24: checks stop launching Brave

Status: underway

Branch: `fix/headless-shell`

## Goal

`ops check`, `npm run check`, `site:shots` and `site:walk` never launch a browser `.app`. Shaun's Dock stops getting Brave tiles from this repo.

## Context

- 2026-11-04: Dock showed 3 extra Brave tiles. Each headless launch of the Brave app binary (inside `Brave Browser.app`) checks in with LaunchServices as `com.brave.Browser`; Dock adds a recent-app tile per launch.
- Playwright's own `chrome-headless-shell` has no bundle id, so no tile. Found + fixed for `ops site-check` in swarm-infra PR 81.
- Here: `ops-check.json` `test` fell back to the Brave binary; `findChrome()` (`commands.cjs`) listed Chrome.app + Chromium.app; `check-viewer.cjs` spawned the found binary with a hand-rolled CDP client; `proof.cjs` used it as a rasterizer fallback; `shot.cjs` + `walk.cjs` passed it to Playwright.
- `playwright-core ^1.64.1` has no bundled browser. Shell revision 1248 is cached in `~/Library/Caches/ms-playwright`.

## Implementation Checklist

### Tier 1 - Quick, contained work

- [x] `browser.test.cjs` (red first): default = no executable path; `.app` override refused; old `CHROME_PATH` ignored; missing shell says how to install; only `browser.cjs` launches a browser
- [x] `browser.cjs`: one launcher `launchBrowser`; `SHOT_CHROME_PATH` accepts a non-`.app` executable only
- [x] `shot.cjs`, `walk.cjs`: launch through `launchBrowser`
- [x] `commands.cjs`, `proof.cjs`: drop `findChrome` and the Chrome rasterizer fallback (`resvg` stays)
- [x] `proof()` was 37 lines (gate fails any touched fn >15): split into small fns. `proof.test.cjs` added; PNG/SVG output byte-identical to before (quick, full, crop runs), same error messages
- [x] `package.json`: `browser:install` script; `browser.test.cjs` joins `check`
- [x] Docs: `AGENTS.md`, `evidence.md`, vendored teardown skill copy (`.agents/skills/teardown`) match

### Tier 2 - Viewer check + CI

- [x] `check-viewer.cjs`: Playwright page replaces spawned binary + hand-rolled CDP client (same checks: page errors, console errors, parts drawn, network requests, screenshots, `--dark`)
- [x] `ops-check.json`: no Brave fallback; CI `setup` runs `npm run browser:install -- --with-deps`

### Tier 3 - Proof

- [x] `ops check` passes on the committed tree
- [x] Dock recent-apps unchanged + no Brave main-binary launch during that run

## Acceptance Coverage

| Requirement | Entry points | Roles and data | Persistence | Verification |
|---|---|---|---|---|
| No browser `.app` launch | `npm run check`, `site:shots`, `site:walk`, `proof.cjs`, CI | n/a | none | `browser.test.cjs`; checker `banned-phrase` row `no-browser-app-in-tooling`; Dock + `ps` evidence below |
| Viewer check unchanged in strength | `check-viewer.cjs` | both drawings, light | none | `npm run check` prints OK for scope + tip |

## Smoke Tests

Not applicable: no UI change. Evidence is agent-run, below.

| Check | Result |
|---|---|
| `browser.test.cjs` + `proof.test.cjs` | 12 pass |
| `npm run check` viewer step | OK scope 11 parts, OK tip 8 parts |
| `ops check` (committed tree) | see PR comment |
| Dock `recent-apps` before/after | see PR comment |

## Product Decisions

- Headless shell over any `.app`: it is not an app, so it can never get a Dock tile.
- One env name, `SHOT_CHROME_PATH` (same as `ops site-check`); `CHROME_PATH` dropped, so a stale `CHROME_PATH` pointing at an app cannot leak in.
- Chrome rasterizer fallback in `proof.cjs` removed: `resvg` is already required (`AGENTS.md`), Quick Look stays as last resort.
- Vendored skill copy synced: a future project copying it would reintroduce the tile.

## Scope

- Browser launch in this repo's checks, CI setup, docs.

## Non-Goals

- Dock layout, Brave setup, other repos.

## Rollback

- Revert the merge. Checks then need a local Chrome again.
