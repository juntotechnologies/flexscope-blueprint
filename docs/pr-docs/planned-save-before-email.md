# PR planned: Save answers before email

Status: planned

Branch: `bugfix/save-before-email`

## Goal

Rater who closes on the email screen still counts. Shaun: some people will close when they see the email request.

## Implementation Checklist

- [x] Answers post right after last clip; email screen shows send status + retry
- [x] Email = separate optional post; blank or unticked = nothing sent
- [x] Script: email-only post adds a contact, no trial rows; tested
- [x] Script deployed before page merge
- [x] Walk: answers built before email; skip + email paths

## Smoke Tests

- [x] **Live script** · agent: answers post, then email post, then read Sheet; test rows cleared

## Non-Goals

- Saving partial runs: closing mid-clips still loses answers.
