# PR planned: More clips + case mix

Status: planned

Branch: `feature/more-clips`

## Goal

Grow the open-license test set from 3 clips to enough exams, w/ normals + lesions + immobility, that a level's score reflects image quality, not 1 easy case.

## Context

Before: 3 clips, 2 patients; hemangioma so obvious it may pass at any level.

## Result

15 clips, 11 sources, sharp 720-1080p footage (except c5 430p, r2 400p). Each: 8 s cut, cropped square, no burned-in text in a frame at 4 s.

| Truth (from paper text only) | Clips |
|---|---|
| Lesion Yes | a3 b9 c5 d8 e2 h7 x4 (7) |
| Lesion No | g4 (1) |
| Mobility: one or both don't | h7 j3 k7 n5 p8 (5) |
| Mobility: both move | m2 r2 (2) |
| No label, usable rating only | f6 |

Gaps, carry into analysis:
- Lesion score = almost all sensitivity: only 1 "No". Reason: no paper states "no lesion"; k7, m2 lesion "No" removed (was inferred from absence).
- **No normal exams.** Search: PMC + Zenodo, Figshare, Dryad, Dataverse (titles screened, capped pages): normal video all high-speed, low resolution, under 6 s or overlaid. roksund-normal rejected for poor quality. Source for normals: cousin/[hospital](./planned-private-clips.md).
- Li clips: paper doesn't state different patients; each treated as own patient id.
- Li + r2 + Baldini license read on PMC, not publisher page. Stelman: sources disagree on version; credited CC BY 3.0. j3, n5, p8 copyright read from Europe PMC.
- Frames sampled every 2-3 s + at 4 s; not every frame. Build strips audio.
- `minutes` 8 = estimate (15 × about 30 s). Replace w/ measured `ms` from cousin run.
- Pages weight: about 1.1 MB/clip avg per rater, about 17 MB total.

## Implementation Checklist

- [x] Accept rule: CC BY only; color laryngoscopy, no burned-in text
- [x] Truth from paper text, quoted in `truthQuote`; check fails on label w/o quote (`clips.test.cjs`)
- [x] Add clips to `tools/quality/open/`, opaque ids, credits page
- [x] Patient ids in `study.json`: same patient pair counted as 1 exam by [Decision analysis](./planned-decision-analysis.md)
- [x] 15 clips = multiple of 5 levels; check fails otherwise
- [x] Moved to [Pilot run](./planned-pilot-run.md): cousin reviews each clip + label, measured run time

## Smoke Tests

- [ ] **Full test on a phone, new clips** · as rater
  1. Open the preview link.
  2. Finish all clips.
  3. Open clip sources.

  **Pass if:**
  - Every clip plays
  - Every clip has credit + license link

## Product Decisions

- Better footage from hospital: [Private clips](./planned-private-clips.md). Don't wait for it.

## Non-Goals

- Private clips on the public site.

## Related Docs

- [Roadmap](../roadmap.md)
