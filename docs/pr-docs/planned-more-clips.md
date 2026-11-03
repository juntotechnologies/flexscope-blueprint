# PR planned: More clips + case mix

Status: planned

Branch: `feature/more-clips`

## Goal

Grow the open-license test set from 3 clips to enough exams, w/ normals + lesions + immobility, that a level's score reflects image quality, not 1 easy case.

## Context

Now: 3 clips, 2 patients; hemangioma so obvious it may pass at any level; few no-lesion cases. Each rater sees each clip once. Open-clip search under way 2026-11-02; add results here.

## Implementation Checklist

- [ ] Accept rule: CC BY or CC0 only, license text checked; color laryngoscopy, ≥8 s folds in view, no burned-in identifiers, no phone-off-monitor
- [ ] Truth comes from paper text, quoted in `study.json`; never inferred from the image
- [ ] Cousin reviews each clip + truth label; record result per clip
- [ ] Add clips to `tools/quality/open/`, opaque ids, credits page
- [ ] Case mix target: about 1/3 normal, 1/3 lesion, 1/3 immobility; subtle + obvious findings
- [ ] Limit per patient: pair from same patient counts as 1 exam in analysis
- [ ] Time a full run; set `minutes` from measurement; if over about 10 min, give each rater a balanced subset
- [ ] Check page weight on phone: clip size + load time

## Smoke Tests

- [ ] **Full test on a phone, new clips** · as rater
  1. Open the preview link.
  2. Finish all clips.
  3. Open clip sources.

  **Pass if:**
  - Every clip plays
  - Stated minutes matches run time
  - Every clip has credit + license link

## Product Decisions

- Better footage from hospital: [Private clips](./planned-private-clips.md). Don't wait for it.

## Non-Goals

- Private clips on the public site.

## Related Docs

- [Roadmap](../roadmap.md)
