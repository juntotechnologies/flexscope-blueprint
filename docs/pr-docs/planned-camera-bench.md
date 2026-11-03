# PR planned: Camera bench test

Status: planned; blocked: spend needs Shaun's approval

Branch: `feature/camera-bench`

## Goal

Buy samples of the surveyed camera, measure what a simulation can't, and re-test its real footage with ENTs before choosing a part.

## Context

Simulation can't test: noise, dynamic range, lens sharpness + flare on wet tissue, field of view, USB compression, real frame rate, LED glare + color, tip heat, cable fit in 3.0 mm cord.

First candidate, from list prices: 10× CM_ENDO_011 or 010 + 10× CM_ENDO_017 decoder, about $405-420, non-cancelable. Seller answers first ([Camera evidence](./planned-camera-evidence.md)). Final part follows [pilot](./planned-pilot-run.md).

## Implementation Checklist

- [ ] Shaun sends seller questions from `tools/quality/cameras.json`; record answers + quotes there
- [ ] Purchase request: part, qty, cost, lead time, seller answers; Shaun approves
- [ ] Bench setup: throat phantom, fixed light + distance, script for capture
- [ ] Measure: resolution chart, noise in low light, real fps + compression, field of view, tip temperature over time
- [ ] Check cable + module fit in 3.5 mm tip + 3.0 mm cord
- [ ] Replace assumed noise values in survey w/ measured ones
- [ ] Capture phantom footage; re-test w/ ENTs next to simulated level
- [ ] `docs/results/<date>-bench.md`: method, data, go/no-go per part; update `cameras.json`

## Smoke Tests

Not applicable to site. Bench results recorded w/ photos + raw measurements.

## Product Decisions

- Decision uses bench + survey together. Neither alone chooses the part.

## Non-Goals

- Medical-grade validation, patient use: concept only, not cleared.

## Related Docs

- [Roadmap](../roadmap.md)
