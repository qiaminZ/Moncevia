# Moncevia native desktop extension — beta

- **Native extension:** 0.1.1-beta, separate from the shared userscript 3.5.1.
- **Scope:** desktop browsers with Manifest V3 extension support. The source is published so users can inspect it; no private account credentials or unpublished algorithms are included.
- **Bundling:** `extension/chromium` and `extension/firefox` each contain the same unchanged `engine.js` copied from `moncevia.user.js`, with platform-specific Manifest V3 background declarations.
- **Security:** no wallet permissions, trading APIs, remote executable code or private Binance endpoints. Requests are limited to a fixed set of public quotation paths; credentials are not sent.
- **Storage:** private to the installed browser extension. Userscript data do not migrate automatically.
- **Tests:** static manifest validation and mocked Chrome/Firefox API broker tests passed. Chromium userscript UI regressions passed previously. Actual installation was blocked in the test environment by managed-browser policy; **real browser installation remains to be validated**.
- **Firefox:** temporary development installation only until Mozilla signing.
- **Store distribution:** not submitted to Chrome Web Store, Microsoft Edge Add-ons, Opera Add-ons or Mozilla Add-ons. No automatic store updates.
- **Licensing:** until the project owner selects an explicit license, public source does not imply permission to redistribute or relicense.

## Release gate

Do not label the extension stable or store-approved until it has passed real Chromium browser installation, a physical Firefox compatibility test, permission review, and independent financial regression tests.
