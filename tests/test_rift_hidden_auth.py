"""RIFT regression: hidden sign-in fields must not block price overlays.

Run against both RIFT storefront hostnames through Playwright route interception,
not a hard-coded rewrite of HOST. Public market calls are mocked by INIT.
Login and checkout pages must stay blocked; unrelated SellAuth storefronts still
need explicit per-domain authorization.
"""
import os
from pathlib import Path

from playwright.sync_api import sync_playwright
from test_browser import INIT

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = (ROOT / "moncevia.user.js").read_text(encoding="utf-8")

HIDDEN_LOGIN = """<aside hidden aria-hidden="true" id="account-dialog">
  <form><label>Email<input type="email"></label>
  <label>Password<input type="password"></label></form>
</aside>"""
CSS_HIDDEN_LOGIN = """<section class="login-modal" style="display:none">
  <input type="password" aria-label="login password">
</section>"""
VISIBLE_LOGIN = """<section aria-label="account login">
  <input type="password" aria-label="login password">
</section>"""

def page_html(login: str) -> str:
    return (
        "<!doctype html><html lang='en'><head><meta charset='utf-8'><title>RIFT Store</title></head>"
        "<body><main><h1>RIFT</h1><article id='price'>€9.99</article></main>"
        + login + "</body></html>"
    )

def exercise(browser, engine: str, mobile: bool, host: str, login: str,
             path: str, expect: str) -> None:
    page = browser.new_page(
        viewport={"width": 390 if mobile else 1280, "height": 844 if mobile else 768},
        has_touch=mobile,
        is_mobile=mobile and engine != "firefox",
        locale="es-CL",
    )
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    try:
        # Network is entirely local: the host and pathname are preserved.
        url = "https://" + host + path
        page.route("**/*", lambda route: route.fulfill(
            status=200, content_type="text/html; charset=utf-8", body=page_html(login)
        ))
        page.goto(url, wait_until="domcontentloaded")
        page.evaluate(INIT)
        page.add_script_tag(content=SCRIPT)
        if expect == "active":
            page.locator("#clplens-fab").wait_for(timeout=12000)
            page.wait_for_function("() => window._requests.length > 0", timeout=12000)
            assert page.locator("#clplens-widget").count() == 1
            merchant = page.locator("#price").evaluate("""el => ({
                first: el.firstChild?.nodeValue,
                type: el.firstChild?.nodeType,
                html: el.outerHTML.slice(0, 1200),
                text: el.textContent
            })""")
            assert merchant["first"] == "€9.99", (engine, mobile, host, path, merchant)
            page.wait_for_function(
                "() => document.querySelector('#price .clplens-badge')?.textContent?.startsWith('≈')",
                timeout=12000,
            )
        elif expect == "consent":
            page.locator("#moncevia-optin").wait_for(timeout=12000)
            assert page.locator("#clplens-widget").count() == 0
            assert page.evaluate("window._requests.length") == 0
            page.locator("#moncevia-optin").click()
            page.locator("#clplens-fab").wait_for(timeout=12000)
            assert page.evaluate("""host =>
                window._persist.clplens_v1.allowedSites.includes(host)
            """, host)
            page.wait_for_function("() => window._requests.length > 0", timeout=12000)
            page.wait_for_function(
                "() => document.querySelector('#price .clplens-badge')?.textContent?.startsWith('≈')",
                timeout=12000,
            )
        else:
            page.wait_for_timeout(250)
            assert page.locator("#clplens-fab,#clplens-widget,#moncevia-optin").count() == 0
            assert page.evaluate("window._requests.length") == 0
        assert not errors, (engine, mobile, host, path, errors)
    finally:
        page.close()


def run():
    engine = os.environ.get("MONCEVIA_TEST_BROWSER", "chromium").lower()
    assert engine in ("chromium", "firefox", "webkit")
    with sync_playwright() as playwright:
        opts = {"headless": True}
        if engine == "chromium":
            opts.update(executable_path="/usr/bin/chromium", args=["--no-sandbox"])
        browser = getattr(playwright, engine).launch(**opts)
        try:
            for mobile in (False, True):
                exercise(browser, engine, mobile, "shop.riftbot.org",
                         HIDDEN_LOGIN, "/", "active")
                exercise(browser, engine, mobile, "shop.riftbot.org",
                         CSS_HIDDEN_LOGIN, "/products", "active")
                exercise(browser, engine, mobile, "riftbot.mysellauth.com",
                         CSS_HIDDEN_LOGIN, "/", "consent")
                exercise(browser, engine, mobile, "shop.riftbot.org",
                         VISIBLE_LOGIN, "/", "blocked")
                exercise(browser, engine, mobile, "shop.riftbot.org",
                         HIDDEN_LOGIN, "/checkout", "blocked")
                exercise(browser, engine, mobile, "shop.riftbot.org",
                         HIDDEN_LOGIN, "/login", "blocked")
        finally:
            browser.close()
    print("PASS", engine, "RIFT hidden-login storefront, domain consent and protected auth routes", flush=True)


if __name__ == "__main__":
    run()
