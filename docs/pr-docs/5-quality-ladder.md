# PR 5: Image-quality ladder test

Status: underway (blocked on real clips + answer endpoint)

Branch: `feature/quality-ladder`

## Goal

Find the lowest camera quality ENTs can still use. Phone-friendly anonymous test at `/quality/`: each rater sees every clip once, at a rotating quality level (720×720 / 400×400 / 200×200 / 200×200 + noise, 15 fps), answers lesion?, both folds move?, usable 1–5. Results per level, split by low- vs high-resource setting.

## Context

- Claude page w/ database ruled out: its database only works for signed-in Claude users in the org / invited guests → outside ENTs can't submit.
- BAGLS ruled out as clip source: data CC BY-NC-SA 4.0 (non-commercial), mostly grayscale, max 512×512, high-speed vocal-fold close-ups (not a scope exam). Sources: Zenodo record 3762320; Sci Data 2020 (PMC7305104).
- No clean public color flexible-laryngoscopy video set w/ findings found → real clips from Shaun's cousin (de-identified, permission from his hospital). Demo clips (synthetic test patterns) stand in until then.

## Implementation Checklist

- [x] `tools/quality/study.json` SSOT: levels, questions, rater fields, clips + true answers, endpoint
- [x] `tools/quality/make-clips.cjs`: ffmpeg crop square → area scale → blur/noise → fps → H.264; real sources in gitignored `tools/quality/sources/`
- [x] `tools/quality/build.cjs` + `site/quality/*`: page; true answers never shipped to page; Latin-square level assignment
- [x] `site/tokens.css`: shared tokens split out of `site/site.css`
- [x] `tools/quality/apps-script.gs`: Sheet web app, 1 row/trial
- [x] `tools/quality/analyze.cjs`: % correct + usable mean per level, per setting (`npm run quality:analyze <csv>`)
- [x] CI installs ffmpeg; `npm run site` builds page + clips
- [x] Walk: full quiz run (payload checked), trial screen video plays, small-phone rater screen
- [ ] Real clips (≥8–12 cases w/ known findings) → `sources/` + `study.json` (blocked: Shaun/cousin)
- [ ] Deploy Apps Script, put URL in `endpoint` (blocked: Shaun sign-in)
- [ ] Decide clip hosting: real clips must not be in public repo/site unless cousin's hospital approves

## Smoke Tests

| Check | Result |
|---|---|
| `npm run check` | pass |
| main site shots 5 viewports | pass |
| `site:walk` 20 steps (incl 3 quiz) | pass |
| analyze on sample CSV | per-level table correct |

## Product Decisions

- Each rater sees each clip once (no memory carry-over); levels balanced across raters.
- Questions scored only where truth is known (lesion, mobility); "usable" = opinion.
- Clip compression (H.264) is part of every level; real USB cameras compress too.
