# Moncevia — Compatibility and installation

Moncevia is **one userscript**, not a native Android or Windows application. All supported setups use the same `moncevia.user.js`, with one financial engine and an adapter for modern `GM.*` and legacy `GM_*` APIs.

## Compatibility matrix

| Platform | Browser | Userscript manager | Status |
|---|---|---|---|
| iOS / iPadOS | Safari | Userscripts | Designed for compatibility; v3.5 physical test pending |
| Android | Firefox | Violentmonkey or Tampermonkey | Supported manager APIs; device test pending |
| Windows / macOS / Linux | Chrome, Edge, Opera, Brave, Vivaldi | Violentmonkey or Tampermonkey | Chromium desktop automated tests |
| Windows / macOS / Linux | Firefox | Violentmonkey or Tampermonkey | Compatible API design; Firefox engine test pending |
| Android | **Chrome official** | Not available | **Unsupported**: Android Chrome has no standard desktop extensions |
| Other | Browsers without extension/userscript support | Not available | Unsupported |

## How to install

**Android / Firefox:** Install Firefox for Android and a userscript manager from Mozilla Add-ons ([Violentmonkey](https://addons.mozilla.org/en-US/android/addon/violentmonkey/) or [Tampermonkey](https://addons.mozilla.org/en-US/android/addon/tampermonkey/)). Open the raw URL below in Firefox and follow the manager's installation prompt. If no prompt appears, use the manager's script editor to import the code.

**PC/laptop:** Install the manager through the browser's official extension store, open the raw URL below and confirm installation. Some Chromium versions require enabling the extension's user-script/developer permissions. Don't install multiple copies.

**iPhone/iPad:** Install and enable Userscripts for Safari; save the script in the configured scripts folder and reload the website.

**Canonical installation URL:** https://raw.githubusercontent.com/qiaminZ/Moncevia/main/moncevia.user.js

## Privacy and compatibility cautions

- New sites require authorization. Financial, login and checkout websites are excluded by best-effort rules; do not override this protection.
- The requests use the manager's granted cross-domain API. Rate APIs and permissions can be blocked by an individual browser, network or manager.
- **Preferences are not synced between browsers/devices.** Data stay in each manager's local storage.
- Tests simulate mobile viewports in Chromium and exercise Promise, callback and legacy GM request APIs. This does **not** certify physical Android Firefox, Safari or desktop Firefox.
- Moncevia gives estimates, not executed orders or actual withdrawal fees. Check the coin, chain/network, exact recipient amount and Binance's final fee before paying.

## Manual acceptance checklist

- [ ] iOS Safari + Userscripts: UI, five tabs, market requests, permissions.
- [ ] Android Firefox + Violentmonkey: install, RIFT selection, rates and storage.
- [ ] Android Firefox + Tampermonkey: same.
- [ ] Chrome/Edge/Opera desktop: install, scroll, dynamic prices, keyboard and storage.
- [ ] Firefox desktop: permissions, API connections, calculation and local history.
- [ ] Different-site opt-in and login/checkout exclusions on every target setup.

## Troubleshooting

1. Verify the browser supports userscript extensions.
2. Verify the manager and Moncevia are both active. Disable old CLP Lens/Moncevia copies.
3. On a new site, use “Moncevia · activar aquí” to authorize it before market requests begin.
4. Ensure cross-origin requests to Binance, CoinGecko, ExchangeRate-API and Coinbase are permitted.
5. Include OS, browser, extension version, Moncevia version and nonsensitive reproduction steps in a bug report.
