# PR planned: Optional contact in survey

Status: planned

Branch: `feature/survey-contact`

## Goal

Add an optional email + "OK to contact" at the end, so we can follow up with raters. No names. Page + privacy wording match what is collected.

## Implementation Checklist

- [x] `study.json` `contact` wording; end screen w/ optional email + OK box; browser format check
- [x] Device size columns (screen w × h, pixel ratio)
- [x] Apps Script: `contacts` tab, 1 row/session, apart from `responses`; tested on fake Sheet (`apps-script.test.cjs`)
- [x] Page: no "anonymous" claim; says purpose, who sees it, how to remove
- [x] Survey note lives on contact screen, not `privacy.html`: that page = Google sign-in tool
- [x] Analysis can't print email: reads `responses` export; email only in `contacts`
- [x] Preview sends nothing: walk checks; email w/o tick stays on page: walk checks
- [x] `tools/quality/deploy-script.sh`: dry run default; signs in, pushes, keeps URL, signs out
- [ ] Deploy script (blocked: needs Shaun's Google sign-in), BEFORE merge: old script silently drops email

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
