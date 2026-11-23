"""Phase 13: high-density storefront and adverse event stress across browser engines.

All API responses are mocked; no real merchant or payment access is exercised.
"""
import os
from pathlib import Path

from playwright.sync_api import sync_playwright
from test_browser import INIT

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = (ROOT / "moncevia.user.js").read_text().replace(
    "const HOST = location.hostname.toLowerCase();",
    "const HOST = 'shop.riftbot.org';",
)
PRICES = "".join(
    f'<article><span id="price{i}" class="store-price">€{i+10}.50</span></article>'
    for i in range(180)
)
HTML = (
    "<html><body><main><h1>Catalogue</h1>" + PRICES +
    '<div hidden><span id="private-price">€9999.00</span></div>'
    '<form><span id="form-price">€9998.00</span><input aria-label="discount"></form>'
    '<button id="buy" onclick="window.buyClicks=(window.buyClicks||0)+1">Purchase</button>'
    "</main></body></html>"
)


def stress(browser, engine, mobile):
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
        page.add_script_tag(content=SCRIPT)
        page.locator("#clplens-fab").wait_for(timeout=12000)
        page.wait_for_function(
            """() => document.querySelectorAll('.clplens-badge').length >= 90""",
            timeout=16000,
        )

        badges = page.locator(".clplens-badge")
        assert 90 <= badges.count() <= 100, (engine, mobile, badges.count())
        assert page.locator("#private-price .clplens-badge").count() == 0
        assert page.locator("#form-price .clplens-badge").count() == 0
        merchant = page.locator("#price0")
        assert merchant.evaluate("el => el.firstChild.nodeValue") == "€10.50"
        before = merchant.locator(".clplens-badge").inner_text()

        # Simulate a single-threaded commerce SPA applying dozens of rapid updates.
        page.evaluate("""() => {
          for (let n=0;n<160;n++){
            const item=document.getElementById('price'+(n%40));
            item.firstChild.nodeValue='€'+(80+n/10).toFixed(2);
          }
        }""")
        page.wait_for_function(
            """previous => document.querySelector('#price0 .clplens-badge')?.textContent !== previous""",
            arg=before, timeout=14000,
        )
        assert page.locator("#price0 .clplens-badge").count() == 1
        assert page.locator(".clplens-badge").count() <= 100
        assert page.locator("#price0").evaluate("el => el.firstChild.nodeValue") == "€92.00"

        # Mutations caused by Moncevia itself must not duplicate annotations.
        page.locator("#clplens-fab").click()
        page.locator(".mv-lang-toggle").click()
        page.wait_for_function(
            """() => document.getElementById('mv-tab-calculator')?.innerText.endsWith('Convert')""",
            timeout=8000,
        )
        page.locator("#clplens-fab").click()
        page.wait_for_timeout(800)
        assert page.locator("#price0 .clplens-badge").count() == 1
        assert page.locator(".clplens-badge").count() <= 100

        page.locator("#buy").click()
        assert page.evaluate("window.buyClicks") == 1
        assert page.locator("#buy").inner_text() == "Purchase"
        assert not errors, (engine, mobile, errors)
    finally:
        page.close()


def unsafe_context(browser, engine):
    page = browser.new_page()
    try:
        page.set_content("<html><body><h1>Account area</h1><input type='password'></body></html>")
        page.evaluate(INIT)
        page.add_script_tag(content=SCRIPT.replace(
            "const HOST = 'shop.riftbot.org';", "const HOST = 'accounts.example';"
        ))
        assert page.locator("#clplens-widget").count() == 0
        assert page.locator("#moncevia-optin").count() == 0
        assert page.evaluate("window._requests.length") == 0
    finally:
        page.close()


def run():
    engine = os.environ.get("MONCEVIA_TEST_BROWSER", "chromium").lower()
    assert engine in ("chromium", "firefox", "webkit")
    with sync_playwright() as playwright:
        launch = {"headless": True}
        if engine == "chromium":
            launch.update(executable_path="/usr/bin/chromium", args=["--no-sandbox"])
        browser = getattr(playwright, engine).launch(**launch)
        try:
            for mobile in (False, True):
                stress(browser, engine, mobile)
            unsafe_context(browser, engine)
        finally:
            browser.close()
    print("PASS", engine, "phase 13: 180 merchant prices, mutation bursts, privacy and native controls", flush=True)


if __name__ == "__main__":
    run()
