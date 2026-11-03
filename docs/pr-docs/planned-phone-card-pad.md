# PR planned: Phone card padding

Status: planned

## Why
`ops site-check` flagged thin padding on phones: `.stage` 10px (8px landscape), `.controls` 8px; limit 12px.

## Implementation Checklist
- [x] `--card-pad` token in `site/tokens.css`; `.stage`, `.controls` use it
- [x] Keep `.controls` 4px on short landscape: drawing needs height; audit passes

## Verification
- `ops site-check shots` + `walk` on tailnet link: 0 faults, 5 viewports
- Phone portrait + landscape PNGs read
- `npm run check`: unit tests pass; viewer check needs Chrome, absent here; CI runs it
