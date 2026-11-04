# PR planned: regular reviewer, not hostile

Status: planned

Branch: `chore/regular-reviewer`

## Goal

`AGENTS.md` tells agents to reread their diff as a regular reviewer.

## Context

Shaun (2026-11-04): "we don't want hostile reviewer, we want regular reviewer". This repo's `AGENTS.md` still says "hostile reviewer". The global rule source (swarm-infra PR 74) is changed and blocks the phrase in new text.

## Implementation Checklist

### Tier 1 - Quick, contained work

- [x] `AGENTS.md`: "hostile reviewer" becomes "regular reviewer". No other change.

## Smoke Tests

- [ ] `grep -ci hostile AGENTS.md` prints 0.

## Product Decisions

- Archived PR docs keep their old words (history).

## Scope

- `AGENTS.md`, this doc, the PR doc index.

## Non-Goals

- Any other instruction change.

## Rollback

- Revert the merge.
