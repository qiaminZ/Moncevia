"""Safari Userscripts compatibility: startup before BODY and modern Promise GM APIs.

Exercises the real packaged userscript in Chromium, Firefox and WebKit, both
mobile-size and desktop. This does not certify installation on a physical iPhone.
All financial API requests are mocked and no checkout is exercised.
"""
import os
from pathlib import Path

from playwright.sync_api import sync_playwright
from test_browser import INIT

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = (ROOT / "moncevia.user.js").read_text(encoding="utf-8")
SCRIPT = SCRIPT.replace(
    "const HOST = location.hostname.toLowerCase();",
    "const HOST = 'shop.riftbot.org';",
)

def exercise(browser, engine, mobile: bool, authorized: bool) -> None:
    page = browser.new_page(
        viewport={"width": 390 if mobile else 1366, "height": 844 if mobile else 768},
        is_mobile=mobile and engine != "firefox",
        has_touch=mobile,
        locale="es-CL",
    )
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    try:
        page.set_content("<!doctype html><html><head><title>Shop</title></head><body><h1>Shop</h1></body></html>")
        page.evaluate(INIT)
        if not authorized:
            page.evaluate("window._persist.clplens_v1={allowedSites:[]}")
        # An injection while BODY is absent used to return permanently, leaving
        # no opt-in and no launcher even once the page became ready.
        page.evaluate("document.body.remove()")
        payload = SCRIPT if authorized else SCRIPT.replace(
            "const HOST = 'shop.riftbot.org';", "const HOST = 'new.example';"
        )
        # Concurrent injections before BODY must still yield a single runtime.
        page.add_script_tag(content=payload)
        page.add_script_tag(content=payload)
        assert page.locator("#clplens-fab,#moncevia-optin").count() == 0
        assert page.evaluate("window._requests.length") == 0
        page.evaluate("""() => {
          const body=document.createElement('body');
          body.innerHTML='<main><h1>Storefront</h1><p id="price">€21.90</p></main>';
          document.documentElement.append(body);
        }""")
        if authorized:
            fab = page.locator("#clplens-fab")
            fab.wait_for(timeout=14000)
            assert fab.count() == 1
            page.wait_for_function("() => window._requests.length > 0", timeout=14000)
            fab.click()
            assert page.locator("#clplens-panel").is_visible()
            assert page.locator("#price").evaluate("el => el.firstChild.nodeValue") == "€21.90"
        else:
            consent = page.locator("#moncevia-optin")
            consent.wait_for(timeout=14000)
            page.wait_for_timeout(300)
            assert consent.count() == 1
            page.add_script_tag(content=payload)
            assert consent.count() == 1
            assert page.locator("#clplens-widget").count() == 0
            assert page.evaluate("window._requests.length") == 0
            consent.click()
            page.locator("#clplens-fab").wait_for(timeout=14000)
            assert page.evaluate(
                "window._persist.clplens_v1.allowedSites.includes('new.example')"
            ) is True
            page.wait_for_function("() => window._requests.length > 0", timeout=14000)
        assert not errors, (engine, mobile, authorized, errors)
    finally:
        page.close()

def run():
    engine = os.environ.get("MONCEVIA_TEST_BROWSER", "chromium").lower()
    assert engine in ("chromium", "firefox", "webkit")
    with sync_playwright() as playwright:
        settings = {"headless": True}
        if engine == "chromium":
            settings.update(executable_path="/usr/bin/chromium", args=["--no-sandbox"])
        browser = getattr(playwright, engine).launch(**settings)
        try:
            for mobile in (False, True):
                for authorized in (False, True):
                    exercise(browser, engine, mobile, authorized)
        finally:
            browser.close()
    print("PASS", engine, "Safari-like early injection and durable permission gating", flush=True)

if __name__ == "__main__":
    run()
