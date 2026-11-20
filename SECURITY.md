# Security policy

Moncevia is an informational userscript, **not a financial execution system**.

## Scope & limitations

- No API credentials, wallet private keys, passwords, or seed phrases. Never submit these to issues or pull requests.
- Changing a fee/financial margin or withdrawal network clears the corresponding "verified" checkbox. User-entered verification can become stale over time and must be reconfirmed before an actual payment.
- Withdrawal fees, minimums, networks and tax/issuer charges are not obtained from authenticated services. Values marked "verified" mean **verified by the user**, not independently validated by Moncevia.
- Binance Spot bid/ask is indicative of only the top of the book. Price, liquidity and fees may change before an order. USDT/USD is sourced separately; USDT is not a risk-free equivalent of USD.
- A denylist cannot encompass every financial website. Only authorize domains where you want price conversion, not banking, checkout or login sites.
- No security audit, actual payment test or physical Safari iOS validation has been performed for this version. Browser automation is based on deterministic mocked market data.

## Reporting

Open a GitHub issue without posting account details, addresses, tokens or screenshots with private information. Include affected browser/userscript version, site type (avoid private URLs), expected behavior and reproduction steps. For a sensitive report, ask the repository owner for a private reporting channel rather than disclosing an exploit in public.