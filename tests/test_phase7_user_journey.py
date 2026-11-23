"""Phase 7 integration: full user journey and merchant isolation on 3 browser engines.

Mocks market sources and never reaches live exchanges, store accounts or payments.
Runs in Chromium, Firefox and WebKit on desktop and emulated mobile.
Physical Safari iOS, Opera GX and VoiceOver are separate acceptance checks.
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
AMOUNT = "#clplens-panel .clplens-inputrow input"


def wait_amount(page, expected):
    page.wait_for_function(
        """expected => document.querySelector('#clplens-panel .clplens-inputrow input')?.value === expected""",
        arg=str(expected), timeout=6500,
    )


def wait_tab(page, tab_id, suffix):
    page.wait_for_function(
        """values => document.getElementById(values[0])?.textContent.trim().endsWith(values[1])""",
        arg=[tab_id, suffix], timeout=6500,
    )


def run_journey(browser, engine, mobile):
    width, height = (390, 844) if mobile else (1366, 768)
    page = browser.new_page(
        viewport={"width": width, "height": height},
        locale="es-CL",
        is_mobile=mobile and engine != "firefox",
        has_touch=mobile,
    )
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    try:
        page.set_content(HTML)
        page.evaluate(INIT)
        page.evaluate(
            """() => { window._merchantClicks = 0; document.getElementById('add').addEventListener('click', () => window._merchantClicks++); }"""
        )
        page.add_script_tag(content=SCRIPT)
        fab = page.locator("#clplens-fab")
        fab.wait_for(timeout=12000)
        assert fab.get_attribute("aria-controls") == "clplens-panel"
        assert fab.get_attribute("aria-expanded") == "false"
        assert page.locator("#clplens-panel").is_hidden()

        # End-to-end path: click a merchant option, then a quantity-changing control.
        fab.click()
        page.wait_for_function(
            """() => document.querySelector('#clplens-fab')?.getAttribute('aria-expanded') === 'true'"""
        )
        assert page.get_by_role("tab").count() == 5
        wait_tab(page, "mv-tab-calculator", "Convertir")
        # Close the overlay before touching controls behind it on small screens.
        fab.click()
        page.wait_for_function(
            """() => document.querySelector('#clplens-fab')?.getAttribute('aria-expanded') === 'false'"""
        )
        page.locator("#opt7").click()
        wait_amount(page, "49.99")
        assert page.locator("#total").evaluate("el => el.firstChild.nodeValue") == "€49.99"
        page.locator("#plus").click()
        wait_amount(page, "99.98")
        assert page.locator("#total").evaluate("el => el.firstChild.nodeValue") == "€99.98"
        fab.click()
        page.wait_for_function(
            """() => document.querySelector('#clplens-fab')?.getAttribute('aria-expanded') === 'true'"""
        )

        # Keyboard focus and semantic tab state cannot depend on clicking icon pixels.
        tab = page.locator("#mv-tab-calculator")
        tab.focus()
        page.keyboard.press("ArrowRight")
        assert page.locator("#mv-tab-crypto").get_attribute("aria-selected") == "true"
        page.keyboard.press("Home")
        assert tab.get_attribute("aria-selected") == "true"

        # UI translation is isolated: a merchant label never changes language.
        merchant_button = page.locator("#add").inner_text()
        page.locator(".mv-lang-toggle").click()
        wait_tab(page, "mv-tab-calculator", "Convert")
        assert page.locator("#add").inner_text() == merchant_button
        assert page.locator("#total").evaluate("el => el.firstChild.nodeValue") == "€99.98"
        page.locator(".mv-lang-toggle").click()
        wait_tab(page, "mv-tab-calculator", "Convertir")
        assert page.locator("#add").inner_text() == merchant_button

        # Manual edits remain authoritative until the user selects a fresh variant.
        page.locator(AMOUNT).first.fill("83")
        wait_amount(page, "83")
        fab.click()
        page.wait_for_function(
            """() => document.querySelector('#clplens-fab')?.getAttribute('aria-expanded') === 'false'"""
        )
        page.wait_for_timeout(500)
        wait_amount(page, "83")
        page.locator("#opt14").click()
        # Quantity remains 2: the merchant total is 2 × €74.99, not €74.99.
        wait_amount(page, "149.98")
        assert page.locator("#total").evaluate("el => el.firstChild.nodeValue") == "€149.98"

        # Native commerce handlers are not swallowed by Moncevia's event capture.
        page.locator("#add").click()
        assert page.evaluate("window._merchantClicks") == 1
        fab.click()
        page.get_by_role("button", name="Cerrar", exact=True).click()
        page.wait_for_function(
            """() => document.querySelector('#clplens-fab')?.getAttribute('aria-expanded') === 'false'"""
        )
        assert page.locator("#clplens-panel").is_hidden()
        assert not errors, (engine, mobile, errors)
    finally:
        page.close()


def run_unauthorized(browser, engine):
    page = browser.new_page()
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    try:
        page.set_content("<h1>Independent merchant</h1><p>€19.99</p>")
        page.evaluate(INIT)
        page.add_script_tag(
            content=SCRIPT.replace("const HOST = 'shop.riftbot.org';", "const HOST = 'other.example';")
        )
        page.locator("#moncevia-optin").wait_for(timeout=12000)
        assert page.evaluate("window._requests.length") == 0
        assert page.locator("#clplens-widget").count() == 0
        assert page.locator("h1").inner_text() == "Independent merchant"
        assert not errors, (engine, errors)
    finally:
        page.close()


def run():
    engine = os.environ.get("MONCEVIA_TEST_BROWSER", "chromium").lower()
    assert engine in ("chromium", "firefox", "webkit"), engine
    with sync_playwright() as playwright:
        launch = {"headless": True}
        if engine == "chromium":
            launch.update(executable_path="/usr/bin/chromium", args=["--no-sandbox"])
        browser = getattr(playwright, engine).launch(**launch)
        try:
            for mobile in (False, True):
                run_journey(browser, engine, mobile)
            run_unauthorized(browser, engine)
        finally:
            browser.close()
    print("PASS", engine, "phase 7: desktop/mobile full journey, accessibility and merchant privacy", flush=True)


if __name__ == "__main__":
    run()
