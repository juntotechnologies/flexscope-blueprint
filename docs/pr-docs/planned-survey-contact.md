# PR planned: Optional contact in survey

Status: planned

Branch: `feature/survey-contact`

## Goal

Add an optional email + "OK to contact" at the end, so we can follow up with raters. No names. Page + privacy wording match what is collected.

## Implementation Checklist

- [ ] `study.json`: optional email + OK-to-contact fields; basic format check at page edge
- [ ] Device size columns (screen w × h, pixel ratio) w/ same redeploy
- [ ] Apps Script + Sheet: new columns, redeploy; email on 1 row per session, not repeated per trial
- [ ] Page: remove any "anonymous" claim; say what email is for + who sees it
- [ ] `privacy.html`: cover survey email: purpose, Sheet access, how to request deletion
- [ ] Analysis never prints email; test proves it
- [ ] Preview mode still sends nothing: test

## Smoke Tests

- [ ] **Email saved once, skip still works** · as rater
  1. Finish the test with an email.
  2. Finish again with no email.
  3. Open the responses Sheet.

  **Pass if:**
  - First run shows the email once
  - Second run saved w/ blank email
  - Test rows removed afterward

## Product Decisions

- Optional, not required: required costs responses + can make answers less candid.
- Shaun tests w/ preview link; nothing saved, nothing to delete.

## Non-Goals

- Names, accounts, sign-in.

## Related Docs

- [Roadmap](../roadmap.md)
