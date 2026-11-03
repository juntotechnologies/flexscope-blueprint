# Camera decision roadmap

Goal: pick camera(s) to buy, on evidence. Each step below = 1 PR doc in `docs/pr-docs/`. Update status there, not here.

## Order

| # | PR doc | Output | Needs | Blocker owner |
|---|---|---|---|---|
| 1 | [Camera evidence](./pr-docs/planned-camera-evidence.md) | Sourced part + price table; README fixed | - | Shaun sends seller questions |
| 2 | [Survey ladder](./pr-docs/planned-survey-ladder.md) | Levels map to parts; level bad enough to fail | 1 | - |
| 3 | [More clips](./pr-docs/planned-more-clips.md) | Case mix w/ normals + lesions | - | Open-license supply |
| 4 | [Survey contact](./pr-docs/planned-survey-contact.md) | Optional email + OK to contact | - | - |
| 5 | [Decision analysis](./pr-docs/planned-decision-analysis.md) | Pass rule set before data; analysis names cheapest passing level | 2 | Shaun + cousin set thresholds |
| 6 | [Pilot run](./pr-docs/planned-pilot-run.md) | Cousin check, then ENT responses + results doc | 2-5 | Shaun sends links |
| 7 | [Private clips](./pr-docs/planned-private-clips.md) | Hospital-approved clips in private test | Hospital OK | Cousin + hospital |
| 8 | [Camera bench](./pr-docs/planned-camera-bench.md) | Real samples measured; real footage re-tested | 1, 6 | Shaun approves spend |

Steps 3 + 4 can run alongside 1 + 2. Step 7 can join step 6 if approval arrives in time; never wait on it to start.

## Evidence rules

- Every claim carries source + date + class: measured, seller list price, search snippet, or assumption.
- Pass rule written + committed before any real response is read.
- Survey results narrow the choice. Purchase needs bench data (step 8).
- Report each number w/ method + n. No result from fewer raters than step 5 sets.
- Raw responses stay in the Sheet; never commit them. Results docs hold totals only.

## Known so far (2026-11-02)

| Finding | Evidence | Class |
|---|---|---|
| Live survey runs end to end | `ops site-check walk` on live site: 23 of 23 steps | measured |
| Current levels barely differ except noise | SSIM vs q720, 3 clips, ffmpeg: q400 0.976-0.983, q200 0.959-0.976, q200low 0.613-0.614 | measured |
| Low price ≠ low pixels at 3.5 mm tip | See step 1 table | seller list prices; no quotes |
| Current clips: 3, from 2 patients | `tools/quality/study.json` | measured |
