# PR 15: Every survey level = real part

Status: in-scope work complete

Branch: `feature/survey-real-parts`

## Goal

Every level pairs w/ a camera we could buy, from best to worst real case, so results name the lowest acceptable part.

## Context

Shaun: each quality must pair w/ an existing camera. Replaces q100bad + q32 (no part). Search 2026-11-02 (web, seller pages + DigiKey snippets): nothing under 200×200 sold as a module; NanEye 250×250 sensor only, no tip module price.

| Level | Part | Tip | Price |
|---|---|---|---|
| q720 | OV9734 | 3.5 mm | $17-42 |
| q720low | OV9734, poor light | 3.5 mm | same |
| q400 | OVM6946 | 2.0 mm | $364-377 |
| q200 | OVM6948 | 1.0 mm | $365-370, snippet |
| q200low (floor) | OVM6948, poor light: worst real case | 1.0 mm | same |

Prices not quotes. Lower resolution = higher price among parts found: tiny sensors cost more. Cheapest part = top level. VGA (AMC0310, $47-63, 3.9 mm) added to table: no saving + too wide; not a level.

Savings don't come from lower sensor resolution. Survey shows tolerance for bad light, lens + noise; that decides how cheap the lens + LED + cable can go.

## Implementation Checklist

- [x] Levels reference real parts; check fails on no camera
- [x] Floor = q200low; noise + blur + fps labelled assumption
- [x] Remove probe + `cheaperPartsWorthSearching`
- [x] `cameras.json`: AMC0310 row; README table regenerated

## Smoke Tests

Not applicable beyond site walk: same page, new clip files.

## Related Docs

- [Roadmap](../roadmap.md)
