# PR Checklist

Use this checklist before review and merge. Publish the generated PR body from the approved planning doc before requesting review.
The published body contains its Goal, Implementation Checklist, and Smoke Tests with matching wording and check states.

## Scope

- [ ] The PR delivers one user outcome or one closely connected workflow.
- [ ] Follow-up work is moved to issues or `docs/pr-docs`, not hidden in review comments.
- [ ] The PR description is a short summary plus a flat copy of the planning doc's checklist and smoke tests, with no links, and it matches the doc.
- [ ] Related issues are linked, closed, or explicitly marked as follow-up.

## Code Quality

- [ ] Changed behavior has focused unit or integration tests.
- [ ] Concerns are reasonably separated.
- [ ] Shared truth is reused instead of duplicating policy, labels, or validation.
- [ ] No dead code, debug code, stale copy, or commented-out leftovers.
- [ ] Each function has one job, is short and flat, and no function is defined inside another.
- [ ] Every value has one named home; SQL lives in `.sql` files behind the module that owns the table.
- [ ] Data crosses module boundaries as typed objects validated once at the edge.
- [ ] Failures log a stable event name with correlating IDs, and never secrets or payloads.
- [ ] The whole diff was reread as a reviewer would, including every function it touches.

## Required Checks

- [ ] Acceptance coverage maps requirements to entry points, roles, representative data, persistence, and verification.
- [ ] The agent completes applicable computer-use walkthroughs and retains their steps, pass criteria, and observed evidence.
- [ ] A fresh agent review checks requirements, the diff, tests, and walkthrough evidence. No unresolved findings remain.

- [ ] `npm run proof` + `npm run check` pass on this commit (proof sheets opened, no occlusion WARNING).
- [ ] Dispatch remote CI only for workflow changes or when Shaun requests it. Report its result when available.

## Conditional Checks

- [ ] If production configuration, deployment or data changes: each command was named and confirmed before it ran, and the rollback is written down.
- [ ] If secrets or private paths changed: no live credentials are committed.

## Merge Readiness

- [ ] Obtain human merge approval. Production and credential changes retain their separate named approvals.

- [ ] PR branch is up to date enough for a clean merge.
- [ ] Risky or irreversible changes have a rollback note.
- [ ] Machine-specific or destructive changes are called out clearly.
