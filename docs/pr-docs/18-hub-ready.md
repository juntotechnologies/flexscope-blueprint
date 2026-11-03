# PR 18: Ready for hub

Status: in-scope work complete

Branch: `feature/hub-ready`

## Goal

Hub can link Flexscope + survey without non-ENT answers changing the verdict.

## Implementation Checklist

- [x] Org link goes to hub card: `https://juntotechnologies.com/#flexscope`
- [x] Verdict, intervals + rater count use ENT roles only; by-role table keeps all

## Smoke Tests

Not applicable beyond `npm run check` + synthetic CSV: no rater-facing change.
