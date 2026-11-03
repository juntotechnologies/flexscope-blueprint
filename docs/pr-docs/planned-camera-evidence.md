# PR planned: Camera evidence table

Status: planned

Branch: `feature/camera-evidence`

## Goal

Make 1 sourced table of cameras we can buy: pixels, tip size, what is needed to get video, cost, source, date, confidence. Survey levels + README read from it. Fix README claims the research disproved.

## Context

Research 2026-11-02 (web; no quotes requested; nothing ordered). Totals = sums of listed prices. Starting data; re-verify on build.

| Pixels | Part | Tip OD | Cost to get video, low qty | Class |
|---|---|---|---|---|
| 1280×720 | OV9734: CM_ENDO_010, 011 | 3.5 mm | $17.43-18.71 @10; $40.57-41.85 if decoder needed | seller list |
| 1280×720 | OV9734: CM_ENDO_014 | 3.3 mm | $19.49 @10; $42.63 w/ decoder | seller list |
| 1280×720 | OV9734: CM_ENDO_023 | 3.9 mm, no fit | $20.51 @10 | seller list |
| 960×960 | ES101: CM_ENDO_021 + decoder | 3.0 mm | $101.72 @10 | seller list; fps unknown |
| 720×720 | OCHFA10: CM_ENDO_007 + decoder | 2.0 mm | $608.28 @10 | seller list |
| 400×400 | OVM6946: CM_ENDO_001 / 002 + decoder | 1.1 / 2.0 mm | $364.00 / $376.86 @10 | seller list; spec table says OV6949: confirm |
| 200×200 | OVM6948 USB, Huake | 1 mm | $365-370 | snippet only |

README errors found: line 34 "(est.)" on 400×400; line 64 "6 LEDs" unverified; line 75 "cheapest 3.5 mm path = OVM6948/46 + own board" false on list prices; build sequence step 2 assumes OVM6948; `study.json` q720 "3.9 mm USB module" is really 1280×720, and q400 "1.4 mm" is really 1.1 mm.

Sources: camemake.eu/shop?tags=7; ovt.com/products/ovm6946, ochfa10, ochta10, ov426; OVM6948 brief v1.5.

Seller cautions: some Camemake pages show "This combination does not exist"; CM_ENDO_012/015 price looks like an error. README eBay + Made-in-China links returned 403: unverified.

## Implementation Checklist

- [ ] `tools/quality/cameras.json`: SSOT for table; each row has source URL, date seen, class
- [ ] Test fails on row w/o source, date or class
- [ ] Re-fetch each seller page; mark changes + unavailable parts
- [ ] Draft seller questions: decoder needed? cable OD (cord = 3.0 mm)? LED count? real fps at 720p? MOQ + lead time? NDA?
- [ ] Record seller answers + quotes in table
- [ ] README: correct lines above; cost-down + build sequence follow table

## Smoke Tests

Not applicable: data + docs. Main site README tabs checked w/ `ops site-check` after edit.

## Product Decisions

- Price = quote or list price w/ date. No source → "unknown".

## Non-Goals

- Buying samples: [Camera bench](./planned-camera-bench.md).

## Related Docs

- [Roadmap](../roadmap.md)
