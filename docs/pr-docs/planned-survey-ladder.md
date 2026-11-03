# PR planned: Survey ladder tied to cameras

Status: planned

Branch: `feature/survey-ladder`

## Goal

Make each survey level stand for a part we can buy, and include a level bad enough to fail, so results show the minimum quality ENTs accept.

## Context

Shaun's run: first 2 clips looked the same. Measured: q400 + q200 stay at SSIM 0.96-0.98 vs q720; only noise level drops (0.61). Causes: soft source footage; video box capped at `min(100%, 44svh)`; ladder has no failing level.

Proposed levels (final set follows camera table):

| Level | Stands for | Result means |
|---|---|---|
| 720×720 crop, 30 fps | OV9734 | Cheap 3.5 mm camera passes |
| 720×720 + noise, 15 fps | OV9734 in poor light | Key test; fail → fix light/lens before changing sensor |
| 400×400, 30 fps | OVM6946 | Tiny camera OK; only buy if tip must go under 3 mm |
| 200×200, 30 fps | OVM6948 | Lower bound on a real part |
| 100×100, 30 fps | No part | Expected to fail; proves raters + clips can detect loss |

## Implementation Checklist

- [ ] `study.json` levels reference `cameras.json` part ids; check fails on unknown id
- [ ] Add floor + noisy-720 levels; drop q200low
- [ ] Measure SSIM per level per clip; store as `quality:levels` output, flag neighbor levels too close
- [ ] Decide noise values: label as assumption until [bench data](./planned-camera-bench.md) replaces them
- [ ] Clips w/ source under level size: flag, never count as true detail (x4 crop = 516 px, upscaled at 720)
- [ ] Larger video: tap to enlarge, still 1 screen; record device size w/ each response
- [ ] Rater count + balance check for 5 levels: clip count = multiple of level count

## Smoke Tests

- [ ] **Levels look different** · as rater
  1. Open the preview link on a phone.
  2. Finish the test.
  3. Tap to enlarge a clip.

  **Pass if:**
  - A floor-level clip looks clearly worse
  - Enlarged clip fills the screen
  - Questions stay reachable, no page scroll

## Product Decisions

- Raters never see a level label or camera name: avoids bias.

## Non-Goals

- Modeling real lens, flare or compression: simulation can't; bench covers it.

## Related Docs

- [Camera evidence](./planned-camera-evidence.md), [Decision analysis](./planned-decision-analysis.md), [Roadmap](../roadmap.md)
