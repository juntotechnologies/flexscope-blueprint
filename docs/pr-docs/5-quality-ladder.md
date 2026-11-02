# PR 5: Image-quality ladder test

Status: underway (answer endpoint next)

Branch: `feature/quality-ladder`

## Goal

Find the lowest camera quality ENTs can still use. Phone-friendly anonymous test at `/quality/`: each rater sees every clip once, at a rotating quality level (720×720 / 400×400 / 200×200 / 200×200 + noise, 15 fps), answers lesion visible?, both folds move?, usable 1–5. Results per level, split by low- vs high-resource setting.

## Context

- Claude page w/ database ruled out: its database only works for signed-in Claude users in the org / invited guests → outside ENTs can't submit.
- BAGLS ruled out as clip source: data CC BY-NC-SA 4.0 (non-commercial), mostly grayscale, max 512×512, high-speed vocal-fold close-ups (not a scope exam). Sources: Zenodo record 3762320; Sci Data 2020 (PMC7305104).
- No clean public color flexible-laryngoscopy video set w/ findings found. Pilot = 3 open-license (CC BY) case-report clips (see Open-License Clip Search). Main study adds clips from Shaun's cousin (de-identified, hospital permission; never committed).

## Implementation Checklist

- [x] `tools/quality/study.json` SSOT: levels, questions, rater fields, clips + true answers, endpoint
- [x] `tools/quality/make-clips.cjs`: ffmpeg crop square → area scale → blur/noise → fps → H.264; real sources in gitignored `tools/quality/sources/`
- [x] `tools/quality/build.cjs` + `site/quality/*`: page; true answers never shipped to page; Latin-square level assignment
- [x] `site/tokens.css`: shared tokens split out of `site/site.css`
- [x] `tools/quality/apps-script.gs`: Sheet web app, 1 row/trial
- [x] `tools/quality/analyze.cjs`: % correct + usable mean per level, per setting (`npm run quality:analyze <csv>`)
- [x] CI installs ffmpeg; `npm run site` builds page + clips
- [x] Walk: full quiz run (payload checked), trial screen video plays, small-phone rater screen
- [x] Pilot clips: 3 CC BY clips committed in `tools/quality/open/`, opaque ids (k7/m2/x4) in page + file names, credits page `/quality/credits.html` (separate page: titles name findings); demo test patterns removed
- [x] Public build = `source: open` clips only; `--real` → private build in gitignored `tools/quality/private-site/` (`mode.cjs`)
- [x] Video: questions locked until clip plays; tap-to-play if autoplay blocked; load error → "Skip clip" (row `skipped`)
- [x] Questions: lesion = any mass/growth (polyp is pharyngeal); mobility option "One or both don't" (BVFP = both fixed)
- [ ] Main-study clips from cousin → `sources/` (blocked: Shaun/cousin)
- [ ] Deploy Apps Script, put URL in `endpoint` (blocked: Shaun sign-in)
- [x] Clip hosting: open-license clips public w/ credit (Shaun 2026-11-02); private clips never public w/o hospital approval

## Smoke Tests

| Check | Result |
|---|---|
| `npm run check` | pass |
| main site shots 5 viewports | pass |
| `site:walk` 21 steps (incl full quiz run, credits page w/ license links) | pass |
| analyze on sample CSV | per-level table correct |

## Product Decisions

- Each rater sees each clip once (no memory carry-over); levels balanced across raters.
- Questions scored only where truth is known (lesion, mobility); "usable" = opinion.
- Clip compression (H.264) is part of every level; real USB cameras compress too.

## Agent Review

Fresh review agent, 6 defects. All fixed.

| # | Defect | Fix |
|---|---|---|
| 1 | Apps Script parallel posts could interleave rows | `LockService` lock around append |
| 2 | `no-cors` send: failures silent, answers lost | CORS fetch, reply must be `ok`, keepalive; "Send again" button; local backup per session, cleared on success |
| 3 | `--real` clips written into public site output | real → gitignored `tools/quality/private-clips/`; CI synthetic only |
| 4 | analyze naive comma split breaks quoted fields | RFC 4180 parser (quotes, `""`, newlines) |
| 5 | level×clip balance unchecked | analyze prints n per clip×level; build warns (`quality.rater_unbalanced`) if clip count not multiple of level count |
| 6 | trial timer counted load time | timer starts on video `playing`; `ms` null if never played |

Minor: analyze exits 1 w/ `quality.no_rows` when no rows; rows w/ no truth for a question skipped in % correct.

Recheck after fixes: `npm run check` pass; shots 5/5; walk 20/20; analyze on quoted-CSV sample correct.

## Open-License Clip Search (2026-11-02)

Method: Wikimedia Commons search (video files, 17 ENT terms); Europe PMC search (laryngoscopy/vocal fold + video supplement + open access + CC BY, 49 articles), all supplements downloaded, `ffprobe` resolution, 1 frame per clip checked by eye.

Result: no set of 8–12 clips. 4 candidate clips at ≥720p effective view, all CC BY:

| Clip | Source | Res | Finding (truth) |
|---|---|---|---|
| BVFP pre-op | PLOS ONE 10.1371/journal.pone.0077233 s001 | 1280×720 | no lesion; both folds fixed |
| BVFP post-op (same patient) | same, s002 | 1280×720 | no lesion; both folds move |
| Hairy polyp, infant | Cureus 10.7759/cureus.71489 | 1280×720 | lesion yes; mobility unknown |
| Laryngeal hemangioma | Cureus 10.7759/cureus.31090 i01/i02 | 1280×720 frame, scope circle ~680 px | lesion yes; mobility unknown |

Below 720p (only fit lower levels): myasthenia BVFP (Frontiers 10.3389/fneur.2020.581060, 854×480); unilateral paresis in sleep endoscopy (Cureus 10.7759/cureus.15157, 640×360); ball-valving laryngeal masses (Commons, 568×320); UVFP pre/post (PLOS 10.1371/journal.pone.0019128, 352×288); ~10 more Cureus case clips at 360–480p.
Not usable: phone film of monitor, ultrasound, X-ray, intubation-only views. Normal larynx 720p on Commons is rigid strobe, not flexible.
Datasets: CE-NBI (CC BY) = contact-endoscopy NBI stills; Laryngoscope8 = stills, no license; BAGLS = non-commercial, grayscale.

Gap: ≤4 patients; mobility truth on 2 clips only; no nasopharynx clips.

Pilot set after review: hairy-polyp dropped (phone filming a monitor, moiré, on-screen patient fields). Hemangioma cropped to scope image 516×516 → its q720 is upscaled (not a true 720 baseline). bvfp-pre/post = same patient (`patient` field) → mobility answers not independent. Pilot only; main study needs cousin clips.

## Agent Review 2 (open clips)

Fresh review agent, 10 findings.

| # | Finding | Action |
|---|---|---|
| 1 | Clip names (diagnosis) in page JSON + video URL | fixed: opaque `id`, human `name` never shipped |
| 2 | CC BY credit lacks license link + copyright | fixed: `licenseUrl`, `copyright`, part, change note |
| 3 | Sheets turns "1-5"/"6-20" into dates | fixed: rows written as plain text (`@`) |
| 4 | Autoplay blocked / 404 → black box, still answerable | fixed: questions locked until `playing`; tap-to-play; error → skip, `quality.clip_failed` log |
| 5 | Public build used all clips (private would leak) | fixed: build + clips filter by `source`; `--real` → private-site |
| 6 | Resend after lost reply double-counts; backup never read | fixed: analyze keeps 1st row per session×clip, drops skipped; backup removed |
| 7 | Same patient twice (bvfp pre/post) | kept: only 3 open clips; recorded as pilot limit |
| 8 | hairy-polyp = phone of monitor; hemangioma crop has text | fixed: polyp dropped; hemangioma `crop` to scope image |
| 9 | analyze w/o arg → stack trace | fixed: `quality.usage` event, exit 1 |
| 10 | Rule nits: inline named callbacks; CSV if-chain; restated counts; stale doc | CSV → step table; counts from study.json (template, walk expectJs); doc fixed. Inline named callbacks kept: repo-wide style in merged PRs 2–4; changing it = separate PR |

Recheck: `npm run check` pass; shots 5/5; walk 21/21; analyze on CSV w/ duplicate, skipped, CRLF, quoted comma correct. Not tested: tap-to-play + load-error paths (no headless way to block autoplay / no real device).
