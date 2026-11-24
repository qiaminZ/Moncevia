# Moncevia — Release readiness and risk assessment

**Target code baseline:** userscript v3.15.3; Chromium/Firefox native extension 0.11.3-beta.
**Distribution status:** BETA / NOT STABLE / NOT STORE-APPROVED.
**Approval status:** NOT CERTIFIED on physical devices.

This document describes the final engineering gate, not evidence that all gates
have passed. Results must be attached to the exact commit proposed for release.

## Automated gates (required for every final release commit)

- [ ] TypeScript strict and ESLint pass.
- [ ] Prettier and bundle source/compiled artifact parity pass.
- [ ] All Vitest unit suites pass, including exchange, crypto, settings and GM storage.
- [ ] Playwright Chromium, Firefox and WebKit pass desktop and emulated mobile cases.
- [ ] 72 dynamic-commerce scenarios, 30 viewport cases, language/accessibility and history concurrency pass.
- [ ] New dense-storefront stress check passes on all three engines with 180 prices.
- [ ] Native manifest/permission/bridge tests and reproducible ZIP packaging pass.
- [ ] scripts/audit_release.py passes on the exact final source and built artifacts.
- [ ] GitHub Actions run on final **main** commit reports success, not just an earlier PR branch.

All checks above are falsifiable through GitHub Actions logs. CI statuses cannot be
assumed from previous release candidates.

## Remaining blockers to a STABLE or store release

- [ ] Physical Safari iOS + Userscripts installation and touch/VoiceOver acceptance.
- [ ] Physical Opera GX Windows unpacked extension installation and browser console review.
- [ ] Physical Firefox desktop browser extension acceptance; Firefox signed distribution where required.
- [ ] Cross-installation permissions and privacy review using real browsers, not just engine simulation.
- [ ] Documented license choice and redistribution rights from the project owner.
- [ ] Distribution submission/signature process and approval by browser add-on stores, if intended.
- [ ] Evidence that no high/critical defects remain unresolved.

See QA_DEVICE_MATRIX.md for steps, evidence requirements and exit criteria.

## Residual engineering risks

1. **Legacy runtime:** src/legacy/runtime.js still coordinates UI forms,
   finance rendering and some handlers. Extracting the panel header, DOM helpers,
   platform storage and event lifecycle does not make the app entirely TypeScript.
2. **Public market prices:** FX/crypto API quotes can be stale or unavailable.
   Crypto network fees and bank spreads remain informational and depend on
   externally verified user settings. No trading or wallet operations are done.
3. **Broad page discovery:** the metadata matches HTTPS shopping pages, but the
   runtime's consent filter must remain fail-closed. Any new permissions or
   network host requires an explicit additional review.
4. **Browser differences:** Safari iOS Userscripts behavior, Firefox signed
   packaging and Opera GX may differ from Playwright's WebKit, Firefox and Chromium.
5. **Local data:** userscript and native extension storage are isolated. No
   automatic migration between different browser installations is promised.

## Release decision

Publish beta source and reviewed build artifacts only after CI passes on the
exact final commit. Keep extension version 0.11.3-beta and do not label the
project as fully stable, physically certified, or add-on-store approved until
all mandatory physical and distribution checks have real evidence.

The 14-phase *engineering plan* can be closed for the automated portion without
misrepresenting the unfinished physical-device acceptance work.
