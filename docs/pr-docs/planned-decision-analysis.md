# PR planned: Decision rule + analysis

Status: planned

Branch: `feature/decision-analysis`

## Goal

Write the pass rule before reading real data, then make analysis report the cheapest level that passes, its part + cost, and how certain the result is.

## Context

Now `analyze.cjs` prints % correct + usable mean per level. No confidence interval, no pass rule, no camera cost, and it treats trials from 1 rater + 1 patient as independent.

Proposed rule; Shaun + cousin confirm numbers before pilot:

| Measure | Proposed pass |
|---|---|
| Lesion + mobility accuracy | Not worse than best level by more than 10 points, using 95% interval lower bound (non-inferiority margin) |
| "Would you use this" | Mean ≥4 of 5 among ENT attendings + residents |
| Floor level | Must score clearly worse; else test can't detect loss + result is void |
| Raters | Target about 20 ENTs; compute real power from pilot before fixing |

## Implementation Checklist

- [x] `study.json` `decision` block: margins + minimum raters; labelled proposed until confirmed
- [x] Analysis: bootstrap 95% interval vs best level, resampling raters + patients (seeded); tested
- [x] Report by setting + role; low-resource raters shown alone
- [x] Join `cameras.json`: part, OD, cost beside each level; `rankUsd` = worst-case seller price, for order only
- [x] Verdict: cheapest passing camera, or "not enough data" / "test void" / "no camera passes"; each tested
- [x] "Can't tell" count per level; counted as not correct
- [x] Results doc template: `docs/results/template.md`

## Defined here

Floor "clearly worse" = interval vs best entirely below 0, or ENT usable mean ≤3. Assumption levels (noisy 720) can't pass/fail a camera: fail → "fix light/lens". Bootstrap with 15 clips, about 11 patients: interval wide by design.

## Smoke Tests

Not applicable: command-line output. Tested on synthetic CSV for pass, fail, void + too-few-raters cases.

## Product Decisions

- Survey verdict = which level to bench-test, not final purchase.

## Non-Goals

- Regulatory-grade clinical study.

## Related Docs

- [Survey ladder](./planned-survey-ladder.md), [Camera evidence](./planned-camera-evidence.md), [Roadmap](../roadmap.md)
