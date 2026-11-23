"""Phase 9 integration: old GM_* callbacks without modern GM API.

Emulates a legacy userscript manager using mocked local storage and market
sources; performs no live API calls, logins or payments.
"""
import os
from pathlib import Path

from playwright.sync_api import sync_playwright
from test_browser import HTML, INIT

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = (ROOT / "moncevia.user.js").read_text().replace(
    "const HOST = location.hostname.toLowerCase();",
    "const HOST = 'shop.riftbot.org';",
)
LEGACY = """() => {
    const modern = window.GM;
    window.GM_getValue = (key, fallback) => window._persist[key] ?? fallback;
    window.GM_setValue = (key, value) => { window._persist[key] = value; return true; };
    window.GM_xmlhttpRequest = options => {
        modern.xmlHttpRequest(options).then(
            response => options.onload(response),
            error => options.onerror(error)
        );
    };
    delete window.GM;
}"""


def run():
    engine = os.environ.get("MONCEVIA_TEST_BROWSER", "chromium").lower()
    assert engine in ("chromium", "firefox", "webkit")
    with sync_playwright() as playwright:
        args = {"headless": True}
        if engine == "chromium":
            args.update(executable_path="/usr/bin/chromium", args=["--no-sandbox"])
        browser = getattr(playwright, engine).launch(**args)
        try:
            for mobile in (False, True):
                page = browser.new_page(
                    viewport={"width": 390 if mobile else 1366, "height": 844 if mobile else 768},
                    is_mobile=mobile and engine != "firefox",
                    has_touch=mobile,
                    locale="es-CL",
                )
                errors = []
                page.on("pageerror", lambda error: errors.append(str(error)))
                try:
                    page.set_content(HTML)
                    page.evaluate(INIT)
                    page.evaluate(LEGACY)
                    page.add_script_tag(content=SCRIPT)
                    fab = page.locator("#clplens-fab")
                    fab.wait_for(timeout=12000)
                    page.wait_for_function(
                        """() => window._persist.clplens_crypto_rates_v2?.usdtUsd > 0""",
                        timeout=12000,
                    )
                    assert page.evaluate("window._requests.length") > 0
                    fab.click()
                    page.locator("#mv-tab-settings").click()
                    page.locator(".mv-lang-toggle").click()
                    page.wait_for_function(
                        """() => window._persist.clplens_v1?.language === 'en'""",
                        timeout=8000,
                    )
                    assert page.locator(".mv-lang-toggle").inner_text() == "EN"
                    fab.click()
                    page.locator("#opt7").click()
                    page.wait_for_function(
                        """() => document.querySelector('#clplens-panel .clplens-inputrow input')?.value === '49.99'""",
                        timeout=8000,
                    )
                    assert page.locator("#total").inner_text() == "€49.99"
                    assert not errors, (engine, mobile, errors)
                finally:
                    page.close()

            # A legacy manager must not issue requests before site consent.
            page = browser.new_page()
            errors = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            try:
                page.set_content("<main><h1>Independent merchant</h1><p>€14.00</p></main>")
                page.evaluate(INIT)
                page.evaluate(LEGACY)
                page.add_script_tag(
                    content=SCRIPT.replace("const HOST = 'shop.riftbot.org';", "const HOST = 'other.example';")
                )
                page.locator("#moncevia-optin").wait_for(timeout=12000)
                assert page.evaluate("window._requests.length") == 0
                assert page.locator("#clplens-widget").count() == 0
                assert not errors, (engine, errors)
            finally:
                page.close()
        finally:
            browser.close()
    print("PASS", engine, "phase 9 callback-only GM storage, FX/crypto requests and consent", flush=True)


if __name__ == "__main__":
    run()
