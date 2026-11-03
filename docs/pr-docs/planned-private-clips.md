# PR planned: Hospital-approved private clips

Status: planned; blocked: needs hospital approval

Branch: `feature/private-clips`

## Goal

Run the test on de-identified hospital clips with confirmed diagnoses, only as approved, and never on the public site.

## Context

`--real` build + gitignored paths exist (`tools/quality/mode.cjs`, `privateOut`). Private hosting does not exist yet.

## Implementation Checklist

- [ ] Get written answer: who approves, what use is allowed, IRB (ethics board) needed?, may clips leave hospital?
- [ ] Record approval scope + date, without patient details
- [ ] Choose hosting that fits approval: access-limited link, or hospital-side only
- [ ] De-identification check per clip: overlays, audio track removed, metadata stripped; test on output
- [ ] Add clips + truth w/ `source: private`; prove public build excludes them
- [ ] Report private + open results separately

## Smoke Tests

- [ ] **Private clips stay private** · as outside visitor
  1. Open the public survey + its clip folder.
  2. Open the private link signed out.

  **Pass if:**
  - No private clip on public site
  - Private link refuses or asks for access, per approval

## Product Decisions

- Private clips: never committed, never public w/o hospital approval (AGENTS.md).

## Non-Goals

- Holding the pilot for these clips.

## Related Docs

- [Roadmap](../roadmap.md)
