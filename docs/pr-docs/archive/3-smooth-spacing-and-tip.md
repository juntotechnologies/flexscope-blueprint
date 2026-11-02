# PR 3: Smooth spacing slider + tip animation

Status: done

Branch: `bugfix/smooth-spacing-and-tip`

## Goal

Dragging Spacing moves parts live (no snap). Distal tip animates exploded ↔ assembled w/o lag, on phones too.

## Context

PR 2 animated via flipbook = 85 exact frames pre-rendered in workers. Measured (node, `drawing/*.js` via vm, this Mac): tip mid-explosion frame 4.9 s, flipbook prep 15.8 s in Chrome (12 cores) → tip never ready → snap + lag. Slider only rendered after 120 ms pause → jumps.

## Implementation Checklist

- [x] Models return per-part 2D slide / unit explosion (`drawing/slides.js`, projection linear) → page moves each part's rendered ink by slide × Δexplosion; exact render replaces it at rest
- [x] Drop flipbook from page; play + slider both use slide motion (instant, any device)
- [x] Tip model lighter: 48-gon rings (was 144 / 96); see-through bending sheath (no fill overlap w/ links). Tip mid frame 4.9 s → 0.62 s, exploded 0.93 → 0.25 s
- [x] README tip images regenerated (sheath see-through)
- [x] Walk steps: slider drag (parts translated mid-drag), slider rest (exact render), tip animating laptop + phone

## Smoke Tests

| Check | Result |
|---|---|
| `npm run check` | pass ×3 (1 earlier run failed, stack only, not reproduced in 3 reruns) |
| `npm run proof` | 12 sheets, no occlusion WARNING |
| `site:shots` 5 viewports | overflow 0, vscroll 0, 0 errors |
| `site:walk` 15 steps | all pass |

- [~] **Drag spacing + tip animation on real phone** · as visitor: live site checked at phone sizes in headless browser (walk 15/15, shots 5/5); real phone not used

## Agent Review

Fresh read-only reviewer: slide math confirmed (linear projection, shared scale/offset). Low findings:

| # | Finding | Class | Action |
|---|---|---|---|
| 1 | Old drawing's preview could flash after switch | defect | drop result if drawing/labels changed |
| 2 | Render failure left moved base + hidden labels | defect | remount base on failure |
| 3 | Possible fit jump at e≠1 | not a defect | measured: scale + offset identical at e = 1/.5/0, both drawings, labels on/off |
| 4 | Duplicate base renders on fast input | perf only | left |

Rerun after fixes: check pass, walk 15/15, shots 5/5.

## Product Decisions

- Mid-motion = moved exploded drawing (hidden lines from exploded state); exact drawing on stop. Trade: tiny x-ray look while moving, for 60 fps everywhere.
- Sheath see-through: shows links inside sleeve; matches "thin sheath".
