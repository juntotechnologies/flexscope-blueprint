# PR <number or short title>: <Human-Readable Title>

<!--
Template for pr-docs. Copy this file to either:
  - docs/pr-docs/<PR#>-<slug>.md        (active/underway PR)
  - docs/pr-docs/planned-<slug>.md      (not yet started)
Delete the HTML comments once filled in. After a PR is closed, move its
numbered doc into docs/pr-docs/archive/ and update README.md.
-->

Status: <planned | underway | in-scope work complete | done> <(add a short qualifier if scope was cut/moved)>

Branch: `<type/short-slug>`

## Goal

<One short paragraph: what this change owns and the user-visible outcome. If this
PR was split out of a larger effort, say why it stands alone.>

## Context

<Optional. Prior PRs this builds on, the current shape of the relevant code, and
the specific gap this closes. Reference concrete files/functions where useful,
e.g. `server/services/transaction-service.ts`. Delete if not needed.>

## Implementation Checklist

Ordered least -> most consequential/complex (per AGENTS.md): quick, contained wins
first; schema-touching, cross-cutting, or high-blast-radius work last. Group into
tiers when the list is long.
The checklist holds build work only: tests, code, decisions, and investigations.
A manual check never goes here; it goes in Smoke Tests.

<!-- Checkbox legend: [ ] not started / [x] done / [~] deferred/moved (strike through with ~~...~~ and link to where it went). Follow TDD: each item pairs a behavior with its test. -->

### Tier 1 - Quick wins (low risk, contained)

- [ ] <task> <brief note on approach / decision>
- [ ] <test that fails first and describes the desired behavior>

### Tier 2 - <name>

- [ ] <task>
- [ ] <test>

### Tier N - <most consequential / schema / cross-cutting>

- [ ] <task>
- [ ] <test>

## Acceptance Coverage

| Requirement | Entry points | Roles and data | Persistence | Verification |
|---|---|---|---|---|
| <user outcome> | <affected surfaces> | <roles and representative states> | <save and reload, or none> | <test or walk> |

## Smoke Tests

The agent runs applicable walkthroughs through computer use on development before human review.
Use representative data and verify visible results. Use a stated reason when no UI walk applies.
Keep automated checks in a separate table. Record blocked walks and explicit human waivers honestly.

Write every walk to be **scanned, not read** — the same way you'd explain it
in a chat message:

- a bold one-line title naming what's checked, plus the role (`· as manager`)
- numbered steps, one action per line, UI labels in **bold**
- a **Pass if:** list, one thing you can see on screen per bullet
- plain words only: no file names, function names, or implementation
  reasons (those belong in the tier above)
- Keep completed walk steps and pass criteria. Add the tested commit, environment, role, result, and evidence location.
- Record automated coverage in a separate table. Retain browser walks for visible behavior and real save/reload persistence.
  Mocked tests do not replace real browser persistence checks.

- [ ] **<What's checked>** · as <role>
  1. <action>
  2. <action>

  **Pass if:**
  - <what you see>
  - <what you see>

## Agent Review

Record the fresh reviewer, reviewed scope, evidence, and unresolved findings.
A passing review requires resolved findings and rerun affected checks. Human merge approval remains separate.

## Review Corrections

Record meaningful corrections here: source, classification, prevention, and proof that the prevention detects the failure.
New product decisions are not defects. Link executable prevention to its owning test instead of repeating its rule.

## Product Decisions

- <Decision and the reasoning behind it, so future readers don't relitigate it.>

## Scope

- <Issues/requirements this resolves, e.g. "Resolve issue #NNN: ...">
- <Explicitly deferred/moved items, with a link to where they went.>

## Non-Goals

- <What this PR intentionally does not do.>

## Related Docs

- [<PR / planned doc it builds on or hands off to>](./<path>.md)
