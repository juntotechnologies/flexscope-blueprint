# PR 13: Survey bottom levels

Status: done

Branch: `feature/survey-bottom`

## Goal

Add levels bad enough to find where quality stops being acceptable, so the survey shows if there is room to save money below 720p.

## Context

Shaun: top levels all look fine, so bottom of the range is untested. 64×64 stayed readable. Priced parts: lower resolution costs more (720p about $42; 400×400, 200×200 about $370), so savings need parts not priced yet, not the parts in `cameras.json`.

| Level | Stands for |
|---|---|
| q720 | OV9734 |
| q720low | OV9734 in poor light |
| q200 | OVM6948 |
| q100bad: 100×100 + noise + blur + 10 fps | No part: probe. Passes → search for cheaper parts |
| q32: 32×32 | No part: floor, expected to fail |

Dropped q400: stays 5 levels (15 clips must divide evenly); q400~q200 flagged too close; 200 passing implies 400 acceptable by eye, but OVM6946 gets no verdict of its own.

## Implementation Checklist

- [x] `study.json` levels; `floor: true` marks the floor; probe has no camera
- [x] Verdict adds `cheaperPartsWorthSearching` when a probe passes; tested
- [x] Label + floor lookups use `floor` flag

## Smoke Tests

Not applicable beyond site walk: same page, new clip files. Walk + frames checked by agent.

## Non-Goals

- Pricing cheap parts: separate search once data asks for it.

## Related Docs

- [Roadmap](../../roadmap.md)
