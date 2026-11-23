"""Phase 11: typed Moncevia-owned panel components remain accessible and isolated."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright
from test_browser import HTML, INIT

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = (ROOT / "moncevia.user.js").read_text().replace(
    "const HOST = location.hostname.toLowerCase();",
    "const HOST = 'shop.riftbot.org';",
)


def run():
    engine = os.environ.get("MONCEVIA_TEST_BROWSER", "chromium").lower()
    assert engine in ("chromium", "firefox", "webkit")
    with sync_playwright() as p:
        args = {"headless": True}
        if engine == "chromium":
            args.update(executable_path="/usr/bin/chromium", args=["--no-sandbox"])
        browser = getattr(p, engine).launch(**args)
        try:
            for mobile in (False, True):
                page = browser.new_page(
                    viewport={"width": 390 if mobile else 1366, "height": 844 if mobile else 768},
                    is_mobile=mobile and engine != "firefox",
                    has_touch=mobile, locale="es-CL",
                )
                errors = []
                page.on("pageerror", lambda error: errors.append(str(error)))
                try:
                    page.set_content(HTML)
                    page.evaluate(INIT)
                    original_merchant = page.locator("#total").evaluate("el => el.firstChild.nodeValue")
                    page.add_script_tag(content=SCRIPT)
                    fab = page.locator("#clplens-fab")
                    fab.wait_for(timeout=12000)
                    panel = page.locator("#clplens-panel")
                    assert panel.is_hidden()
                    assert fab.get_attribute("aria-controls") == "clplens-panel"
                    assert fab.get_attribute("aria-expanded") == "false"
                    assert page.locator("#clplens-widget style").count() == 0
                    assert page.locator("style[data-clplens='2']").count() == 1
                    assert page.locator(".mv-version").inner_text() == "v3.14.0"
                    assert page.locator(".mv-rates-disclosure").count() == 1

                    links = page.locator(".mv-rates-disclosure a")
                    assert links.count() == 4
                    for link in links.all():
                        assert link.get_attribute("target") == "_blank"
                        assert "noopener" in link.get_attribute("rel")
                        assert "noreferrer" in link.get_attribute("rel")

                    fab.click()
                    assert panel.is_visible()
                    assert page.get_by_role("tab").count() == 5
                    assert page.locator("#mv-tab-calculator").get_attribute("aria-selected") == "true"
                    page.locator("#mv-tab-crypto").click()
                    assert page.locator("#mv-tab-crypto").get_attribute("aria-selected") == "true"
                    page.locator("#mv-tab-calculator").click()
                    page.locator(".mv-lang-toggle").click()
                    page.wait_for_function(
                        """() => document.getElementById('mv-tab-calculator')?.innerText.endsWith('Convert')"""
                    )
                    assert page.locator("#total").evaluate("el => el.firstChild.nodeValue") == original_merchant
                    assert page.locator("#clplens-panel .mv-titlebar h2").inner_text() == "Moncevia"
                    assert not errors, (engine, mobile, errors)
                finally:
                    page.close()
        finally:
            browser.close()
    print("PASS", engine, "phase 11: typed panel DOM, accessibility and merchant isolation", flush=True)


if __name__ == "__main__":
    run()
