# PR planned: Add survey link to README

Status: planned

Branch: `docs/readme-survey-link`

## Goal

Add the survey link next to the main site link in the README, so Shaun can find both links in the repo. The public site page does not change.

## Implementation Checklist

- [x] README: `Site: survey ...` line; `tools/site/build.cjs` drops `Site: ` lines, so survey link stays off main page

## Smoke Tests

Not applicable: no visible site change. Agent built site + confirmed new line absent from main page.
