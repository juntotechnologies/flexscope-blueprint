# PR planned: Pilot run + results

Status: planned

Branch: `docs/pilot-results`

## Goal

Run the rebuilt survey in 2 stages, cousin first, then ENTs, and publish a dated results doc with the decision it supports.

## Implementation Checklist

- [ ] Stage 0: cousin reviews preview + clips; record each correction + fix
- [ ] Confirm Sheet empty + [pass rule](./planned-decision-analysis.md) committed
- [ ] Stage 1: 3-5 ENTs; check completion, time, phone problems, level balance; fix; keep or discard these rows, decided before reading scores
- [ ] Stage 2: send to rest until minimum raters; include low-resource settings
- [ ] Track outreach counts only: sent, started, finished, by setting
- [ ] `docs/results/<date>-pilot.md`: method, n, table, verdict, limits; totals only
- [ ] Results feed next step: which part goes to [bench](./planned-camera-bench.md)

## Smoke Tests

- [ ] **Real link end to end before sending** · as rater
  1. Finish the real link once.
  2. Check the responses Sheet.
  3. Delete the test rows.

  **Pass if:**
  - Rows appear w/ correct level + clip
  - Sheet back to header only

## Product Decisions

- Don't change levels or clips mid-Stage 2; a change starts a new, separately reported round.

## Non-Goals

- Commit raw responses or emails.

## Related Docs

- [Roadmap](../roadmap.md)
