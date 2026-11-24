"""Final Safari/RIFT regression: SPA privacy gates and BODY replacement recovery.

Runs with real URL hosts but entirely intercepted HTML and mocked rate providers.
Never visits a real shop, sends credentials or initiates payments.
"""
import os

from playwright.sync_api import sync_playwright
from test_browser import INIT, S

SCRIPT = open(S, encoding="utf-8").read()

HTML = """<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>RIFT shop SPA</title><style>.auth-closed{display:none}</style></head><body>
<main><h1>RIFT</h1><article id="price">€9.99</article></main>
<aside id="auth" hidden aria-hidden="true">
<form><label>Password<input id="password" type="password"></label></form>
</aside>
</body></html>"""


def setup(browser, host="shop.riftbot.org", mobile=False):
    page = browser.new_page(
        viewport={"width": 390 if mobile else 1280, "height": 844 if mobile else 768},
        locale="es-CL", has_touch=mobile,
        is_mobile=mobile and browser.browser_type.name != "firefox",
    )
    page.route("**/*", lambda route: route.fulfill(
        status=200, content_type="text/html; charset=utf-8", body=HTML
    ))
    page.goto("https://" + host + "/", wait_until="domcontentloaded")
    page.evaluate(INIT)
    return page


def wait_badge(page, selector="#price"):
    page.wait_for_function(
        """sel => document.querySelector(sel + ' .clplens-badge')?.textContent?.startsWith('≈')""",
        arg=selector, timeout=14000,
    )


def test_spa_recovery(browser, engine, mobile):
    page = setup(browser, mobile=mobile)
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    try:
        page.add_script_tag(content=SCRIPT)
        fab = page.locator("#clplens-fab")
        fab.wait_for(timeout=14000)
        wait_badge(page)
        assert page.locator("#price").evaluate("el => el.firstChild.nodeValue") == "€9.99"

        # A store can open a login dialog without navigating or reinjecting code.
        page.evaluate("""() => {
          const auth=document.getElementById('auth');
          auth.hidden=false;
          auth.removeAttribute('aria-hidden');
        }""")
        page.wait_for_function(
            """() => document.getElementById('clplens-widget')?.style.display === 'none'""",
            timeout=8000,
        )
        assert page.locator("#clplens-widget").is_hidden()
        assert page.locator(".clplens-badge").count() == 0
        assert page.locator("#price").evaluate("el => el.firstChild.nodeValue") == "€9.99"

        # Closing the account modal restores the original widget and scanning.
        page.evaluate("""() => {
          const auth=document.getElementById('auth');
          auth.hidden=true;
          auth.setAttribute('aria-hidden','true');
        }""")
        page.wait_for_function(
            """() => document.getElementById('clplens-widget')?.style.display !== 'none'""",
            timeout=8000,
        )
        assert page.locator("#clplens-widget").is_visible()
        wait_badge(page)

        # Frameworks also toggle dialog visibility with only a CSS class:
        # no nodes are added or removed during these transitions.
        page.evaluate("""() => {
          const auth=document.getElementById('auth');
          auth.classList.add('auth-closed');
          auth.hidden=false;
          auth.removeAttribute('aria-hidden');
        }""")
        assert page.locator("#clplens-widget").is_visible()
        page.evaluate("document.getElementById('auth').classList.remove('auth-closed')")
        page.wait_for_function(
            """() => document.getElementById('clplens-widget')?.style.display === 'none'""",
            timeout=8000,
        )
        assert page.locator("#clplens-widget").is_hidden()
        assert page.locator(".clplens-badge").count() == 0
        page.evaluate("document.getElementById('auth').classList.add('auth-closed')")
        page.wait_for_function(
            """() => document.getElementById('clplens-widget')?.style.display !== 'none'""",
            timeout=8000,
        )
        wait_badge(page)

        # Simulate a SPA checkout route: no full reload and no DOM mutation is
        # required when popstate indicates a changed browser history location.
        page.evaluate("""() => {
          history.pushState({}, '', '/checkout');
          window.dispatchEvent(new PopStateEvent('popstate'));
        }""")
        page.wait_for_function(
            """() => document.getElementById('clplens-widget')?.style.display === 'none'""",
            timeout=8000,
        )
        assert page.locator("#clplens-widget").is_hidden()
        assert page.locator(".clplens-badge").count() == 0
        page.evaluate("""() => {
          history.replaceState({}, '', '/products');
          window.dispatchEvent(new PopStateEvent('popstate'));
        }""")
        page.wait_for_function(
            """() => document.getElementById('clplens-widget')?.style.display !== 'none'""",
            timeout=8000,
        )
        wait_badge(page)

        # A React-like SPA may replace BODY entirely: observation should
        # remain connected, and the existing FAB must be reattached only once.
        page.evaluate("""() => {
          const body=document.createElement('body');
          body.innerHTML='<main><h1>RIFT products</h1><p id="new-price">€42.50</p></main>';
          document.body.replaceWith(body);
        }""")
        page.wait_for_function(
            """() => document.querySelectorAll('#clplens-widget').length === 1 &&
            document.getElementById('clplens-widget')?.isConnected""",
            timeout=12000,
        )
        wait_badge(page, "#new-price")
        assert page.locator("#new-price").evaluate(
            "el => el.firstChild.nodeValue"
        ) == "€42.50"
        fab.click()
        assert page.locator("#clplens-panel").is_visible()
        assert not errors, (engine, mobile, errors)
    finally:
        page.close()


def test_consent_after_spa_checkout(browser, engine, mobile):
    page = setup(browser, host="riftbot.mysellauth.com", mobile=mobile)
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    try:
        page.add_script_tag(content=SCRIPT)
        optin = page.locator("#moncevia-optin")
        optin.wait_for(timeout=12000)
        assert page.evaluate("window._requests.length") == 0
        page.evaluate("history.pushState({}, '', '/checkout')")
        optin.click()
        page.wait_for_function(
            """() => !document.getElementById('moncevia-optin')""",
            timeout=5000,
        )
        assert page.locator("#clplens-widget").count() == 0
        assert page.evaluate("window._requests.length") == 0
        assert not page.evaluate(
            "window._persist.clplens_v1?.allowedSites?.includes('riftbot.mysellauth.com') ?? false"
        )
        assert not errors, (engine, mobile, errors)
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
                test_spa_recovery(browser, engine, mobile)
                test_consent_after_spa_checkout(browser, engine, mobile)
        finally:
            browser.close()
    print("PASS", engine, "SPA auth privacy, checkout, BODY recovery, consent", flush=True)


if __name__ == "__main__":
    run()
