# PR 17: Pick up here (from 2026-11-03)

Status: open; list not done, do not merge yet

Branch: `docs/resume-tomorrow`

## Goal

1 place listing what is left on the survey, in order. Don't merge until list is done: this PR is the list.

## Where things stand

- Real survey live: https://flexscope.juntotechnologies.com/quality/ (saves answers)
- Preview, saves nothing: https://flexscope.juntotechnologies.com/quality/?preview
- Answers Sheet (headers only, no real data): https://docs.google.com/spreadsheets/d/1yYPEzB9YIE_FpfSGAK8gaAKdXt86R_240wKYD1zNxx0/edit
- 15 clips; every level = a real camera; answers save before email screen
- Roadmap: `docs/roadmap.md`

| Level | Camera | Tip | Price, not a quote |
|---|---|---|---|
| q720 | OV9734 | 3.5 mm | $17-42 |
| q720low | OV9734, poor light (simulated guess) | 3.5 mm | same |
| q400 | OVM6946 | 2.0 mm | $364-377 |
| q200 | OVM6948 | 1.0 mm | $365-370, search snippet |
| q200low | OVM6948, poor light (simulated guess); floor | 1.0 mm | same |

## Implementation Checklist

Shaun, in order:

- [ ] Send cousin the real link, https://flexscope.juntotechnologies.com/quality/ . Ask: check each clip against its label (`tools/quality/study.json`, field `truthQuote`); is 10 points the right pass margin; which normal exam clips could the hospital approve
- [ ] Trash 2 blank Sheets: https://docs.google.com/spreadsheets/d/1V4k7oFl6R2t_-key1UNg1K77yLuP8-7vGKyt3dctKn0/edit + https://docs.google.com/spreadsheets/d/1IMByzB8Xn6RfH1BjEFpsr4DMtP0uN7wZzHIdnJYzffQ/edit. Or tell agent "trash those 2 sheets". Keep 1yYPEz…
- [ ] After cousin replies: email seller 5 questions, `sellerQuestions` in `tools/quality/cameras.json`
- [ ] After agent says clips are fixed: send link to about 20 ENTs
- [ ] After verdict: approve sample buy, about $405-420 (money)

Agent, once cousin replies:

- [ ] Check Sheet got rows from a real page run (only direct script posts + preview walks tested so far)
- [ ] Set `minutes` in `study.json` from cousin's measured time (8 = estimate)
- [ ] Remove clips cousin rejects; keep count a multiple of 5
- [ ] Set pass margin + mark `decision.status` confirmed. At 20 raters, levels 3-5 points below best failed 10-point margin on made-up data
- [ ] Add normal exams if hospital approves: never commit, [Private clips](./planned-private-clips.md)

Agent, after ENT responses:

- [ ] `npm run quality:analyze`; results doc from `docs/results/template.md`
- [ ] [Camera bench](./planned-camera-bench.md): real noise replaces simulated guesses

Agent, before survey link goes public on the hub:

- [ ] Analysis: verdict + `minRaters` count ENT roles only; test. Today every session counts. Hub plan: https://github.com/juntotechnologies/juntotechnologies.github.io/blob/docs/hub-all-projects/docs/plans/hub-all-projects.md

Agent, not blocking survey:

- [ ] Trim old instruction text to `ops` pointers; `ops lint --install-hook` in repos
- [ ] swarm-infra: archive PR 42 doc w/ next swarm change
- [ ] 3d-printing-lab: bare `python3` → `uv`
- [ ] `~/.ssh/config` differs from personal-config copy: resolve

## Known Limits

- No normal exams; only 1 "no lesion" clip: lesion score is almost all sensitivity
- Closing mid-clips loses answers; closing on email screen doesn't
- Savings don't come from lower sensor resolution: cheapest part found is top level
- q720low looks close to q720 + q200 by eye on some frames

## Smoke Tests

Not applicable: list only.
