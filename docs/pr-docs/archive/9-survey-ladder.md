# PR 9: Survey ladder tied to cameras

Status: done

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
| 64×64, 30 fps | No part | Expected to fail; proves raters + clips can detect loss. 100×100 still looked readable, so went lower |

## Implementation Checklist

- [x] `study.json` levels reference `cameras.json` part ids; check fails on unknown id (`levels.test.cjs`, in `npm run check`)
- [x] Add floor + noisy-720 levels; drop q200low
- [x] `npm run quality:levels`: SSIM per level per clip; warns on neighbor levels too close
- [x] Noise values labelled `assumption` in `study.json` until [bench data](../planned-camera-bench.md) replaces them
- [x] Clips w/ source under level size: `upscaled` column in `quality:levels`
- [x] Enlarge button: video fills screen, Close returns; resets each clip
- [x] Bitrate cap 3 Mbit/s: noisy clips were 21 MB, now about 3.2 MB
- [x] Intro: drop "Cheaper cameras mean lower image quality" (primes raters)
- [x] Moved to [Survey contact](../planned-survey-contact.md): device size column (Apps Script change)
- [x] Balance warning stays until [More clips](../planned-more-clips.md): 3 clips, 5 levels

## Measured

Method: `npm run quality:levels` (ffmpeg SSIM vs q720, upscaled bicubic), commit of this PR, 3 clips.

| Level | SSIM | Size, 8 s |
|---|---|---|
| q720low | 0.79-0.81 | 3.2-3.3 MB |
| q400 | 0.976-0.983 | about 0.5 MB |
| q200 | 0.960-0.975 | about 0.2 MB |
| q64 | 0.930-0.958 | 25-44 KB |

Limit: q400~q200 stay flagged too close: source footage soft + SSIM forgiving on smooth tissue. Side-by-side frames do differ by eye. Results between these 2 levels: read w/ care.

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

- [Camera evidence](../planned-camera-evidence.md), [Decision analysis](../planned-decision-analysis.md), [Roadmap](../../roadmap.md)
