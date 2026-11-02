# PR 2: One-screen site w/ live drawing

Status: underway

Branch: `feature/one-screen-site`

## Goal

Site = 1 screen, no page scroll (like bench-bridge). Live drawing on main page: exploded ↔ assembled animates, spacing slider, part labels, shaded + colored parts. README sections → tabs. Separate 3D viewer link dropped (page does same job).

## Implementation Checklist

### Tier 1 - Data
- [x] Part hues + fills in `drawing/data.json` (`colors`); `tools/gen.cjs` passes through → offline viewer gets same colors
- [x] `tools/site/ink.cjs`: hue → hex, constants read from teardown `viewer.js` (no copy)

### Tier 2 - Page
- [x] `site/template.html` + `site/site.css`: header, drawing pane, tabbed details pane; ≤899px = 1 pane + bottom dock (Drawing / Details)
- [x] `site/site.js`: teardown render queue + flipbook in browser; labels on by default; crop to ink once per drawing; zoom 100–400% inside viewport
- [x] `tools/site/build.cjs`: inline worker + engine; tabs from `site/site.json` `tabs` (build fails if README section missing); viewer copy + CTA removed
- [x] `tools/site/serve.cjs`: fix redirect loop at base `/`

### Tier 3 - Checks
- [x] `tools/site/shot.cjs`: fail on page scroll (`vscroll`); wait on ready selector
- [x] `tools/site/walk.cjs` + `walk.json` (`npm run site:walk <url> <dir>`): assembled, mid-animation, tip, labels off, parts tab, dark, phone zoom, phone details, phone tip assembled

## Acceptance Coverage

| Requirement | Entry points | Verification |
|---|---|---|
| No page scroll, no side scroll | 5 viewports | `site:shots` overflow 0, vscroll 0 |
| Exploded ↔ assembled animates | View buttons | walk `laptop-animating` (`data-playing` mid-run) |
| Labels on parts, toggle | Labels btn | walk `laptop-no-labels` + screenshots |
| Shaded/colored parts, both themes | drawing | walk `laptop-dark` + screenshots |
| Tabs for text | details tabs, phone dock | walks `laptop-parts-tab`, `phone-details` |

## Smoke Tests

Auto checks (commit = PR head, tailnet dev server `http://citmini.taila4fc43.ts.net:4321/`, headless Chrome 1248):

| Check | Result |
|---|---|
| `npm run check` (gen drift, site build, offline viewer 11/11 + 8/8 parts) | pass |
| `site:shots` 5 viewports | overflow 0, vscroll 0, 0 errors |
| `site:walk` 9 steps | all expect ok, vscroll 0, 0 errors |

- [ ] **Live site on phone** · as visitor
  1. Open site on phone after merge
  2. Tap **Assembled**, then **Exploded**
  3. Tap **Details**, then **Parts**

  **Pass if:**
  - page never scrolls; only details text scrolls
  - parts slide together/apart smoothly
  - labels readable after zoom **+**

## Product Decisions

- Drop separate viewer from site: main page now animates + labels. Offline `dist/index.html` stays for SVG/PNG/PDF export.
- Phone portrait: drawing fits width (small); zoom buttons instead of different layout. Model camera unchanged.

## Non-Goals

- Rotating/re-posing models for portrait; part tap → highlight row.
