# Moncevia — Device acceptance matrix (manual, blocking for stable release)

**Status:** NOT CERTIFIED. Automated Playwright runs emulate browser engines and
screen sizes; they do not test installed Safari Userscripts on a physical iPhone,
Opera GX on Windows, actual Firefox extension permissions or VoiceOver.

Do not mark a device accepted without an installation, dated evidence and the
browser/OS/userscript-manager version. Never record account credentials, wallet
details, orders, personal data or payment information in test evidence.

| Environment | Install channel | Status | Acceptance evidence |
| --- | --- | --- | --- |
| iPhone/iPad Safari | Userscripts extension | **Pending physical test** | iOS, Safari, Userscripts versions, screen recording with mock shop |
| Opera GX Windows | Unpacked Chromium extension | **Pending physical test** | Windows/Opera GX versions, console evidence and mock-shop recording |
| Chrome/Edge Windows/macOS | Unpacked Chromium extension | **Pending physical test** | Browser, OS, extension version and permission review |
| Firefox desktop | Temporary unpacked extension | **Pending physical test** | Browser version, expiry after restart, consent and FX checks |
| Firefox Android | Compatible userscript manager | **Pending physical test** | Device/OS/browser/manager versions and consent |
| Playwright Chromium | Desktop/mobile emulation | Automated CI | Jobs from the exact final main commit |
| Playwright Firefox | Desktop/mobile emulation | Automated CI | Jobs from the exact final main commit |
| Playwright WebKit | Desktop/mobile emulation | Automated CI | Jobs from the exact final main commit |

## Acceptance cases per physical environment

- [ ] Script installs without syntax errors and the expected v3.15.1 / extension 0.11.1-beta is visible.
- [ ] No widget, network quote requests or data collection on a shop before explicit consent.
- [ ] Site consent survives browser reload, and revoking consent prevents future scans.
- [ ] Password fields, payment routes and restricted banking or exchange sites remain excluded.
- [ ] Native shop controls and prices remain functional; Moncevia badges never replace the merchant's amount.
- [ ] Selecting a plan and changing its quantity synchronizes with the live merchant total.
- [ ] Typing a manual amount prevents asynchronous storefront updates from overwriting it.
- [ ] English/Spanish/Auto translation affects only Moncevia-owned labels and accessibility attributes.
- [ ] Keyboard tabs, screen-reader labels, FAB dragging, and safe-area/rotation do not hide controls.
- [ ] Local history persists, exports CSV without formula injection, and clears safely during concurrent saves.
- [ ] Offline state does not invent fresh financial quotes; cache freshness and fee verification remain explicit.
- [ ] Background/tab restore (including bfcache when supported) resumes price updates with no duplicate widgets.
- [ ] A clean uninstall/reinstall and a reload do not create duplicate running scripts.

## Defect record and exit criteria

For each failure record: environment and versions; URL of a **test shop**;
reproduction steps; expected versus actual result; relevant screenshot/video
without secrets; severity (blocking/high/medium/low); and the confirming fix PR.

A stable release is blocked if any of these remain unresolved: financial
calculation discrepancy, unauthorized network request, permission escalation,
payment/credential handling, broken native merchant controls, crashes, lost local
history, unverified Safari/Opera GX installation, missing required browser-store
signing, or failed CI on the exact release commit.

Emulation-only evidence must **never** be relabeled as a passed physical test.
