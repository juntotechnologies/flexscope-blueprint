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
| Lesion + mobility accuracy | 95% interval lower bound ≥10 points below best level or better (non-inferiority margin: 10 points) |
| "Would you use this" | Mean ≥4 of 5 among ENT attendings + residents |
| Floor level | Must score clearly worse; else test can't detect loss + result is void |
| Raters | Target about 20 ENTs; compute real power from pilot before fixing |

## Implementation Checklist

- [ ] `study.json` `decision` block: margins + minimum raters; committed before real data
- [ ] Analysis: interval per level; accounts for repeats by rater + clip; test vs known sample
- [ ] Report by setting + role; low-resource raters shown alone
- [ ] Join `cameras.json`: output part, OD, cost beside each level
- [ ] Verdict: cheapest passing level, or "not enough data" / "test void"; test each case
- [ ] "Can't tell" count reported per level, not hidden as wrong
- [ ] Results doc template: `docs/results/`; totals only

## Smoke Tests

Not applicable: command-line output. Tested on synthetic CSV for pass, fail, void + too-few-raters cases.

## Product Decisions

- Survey verdict = which level to bench-test, not final purchase.

## Non-Goals

- Regulatory-grade clinical study.

## Related Docs

- [Survey ladder](./planned-survey-ladder.md), [Camera evidence](./planned-camera-evidence.md), [Roadmap](../roadmap.md)
