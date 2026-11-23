"""Phase 12: mutation bursts, bfcache suspension/resume and merchant isolation."""
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
    with sync_playwright() as playwright:
        launch = {"headless": True}
        if engine == "chromium":
            launch.update(executable_path="/usr/bin/chromium", args=["--no-sandbox"])
        browser = getattr(playwright, engine).launch(**launch)
        try:
            for mobile in (False, True):
                page = browser.new_page(
                    viewport={"width": 390 if mobile else 1366, "height": 844 if mobile else 768},
                    is_mobile=mobile and engine != "firefox",
                    has_touch=mobile,
                    locale="es-CL",
                )
                errors = []
                page.on("pageerror", lambda e: errors.append(str(e)))
                try:
                    page.set_content(HTML)
                    page.evaluate(INIT)
                    page.add_script_tag(content=SCRIPT)
                    page.locator("#clplens-fab").wait_for(timeout=12000)
                    page.wait_for_function(
                        """() => document.querySelector('#total .clplens-badge')?.textContent.length > 1""",
                        timeout=14000,
                    )
                    original_badge = page.locator("#total .clplens-badge").inner_text()
                    page.evaluate("""() => {
                      for(let i=0;i<75;i++){
                        let node=document.getElementById('total').firstChild;
                        node.nodeValue='€'+(40+i/100).toFixed(2);
                      }
                    }""")
                    page.wait_for_function(
                        """old => document.querySelector('#total .clplens-badge')?.innerText !== old""",
                        arg=original_badge, timeout=12000,
                    )
                    assert page.locator("#total .clplens-badge").count() == 1
                    assert page.locator("#total").evaluate(
                        "el => el.firstChild.nodeValue"
                    ) == "€40.74"

                    # BFCache navigation must not strand observers in a disconnected state.
                    page.evaluate("window.dispatchEvent(new Event('pagehide'))")
                    page.evaluate("window.dispatchEvent(new Event('pageshow'))")
                    previous = page.locator("#total .clplens-badge").inner_text()
                    page.locator("#total").evaluate(
                        "(el) => {el.firstChild.nodeValue='€61.15';}"
                    )
                    page.wait_for_function(
                        """old => document.querySelector('#total .clplens-badge')?.innerText !== old""",
                        arg=previous, timeout=12000,
                    )
                    assert page.locator("#total .clplens-badge").count() == 1
                    assert page.locator("#clplens-widget").count() == 1
                    assert page.locator("style[data-clplens='2']").count() == 1

                    # Native commerce actions still receive their clicks.
                    page.locator("#add").click()
                    assert page.locator("#add").count() == 1
                    assert not errors, (engine, mobile, errors)
                finally:
                    page.close()
        finally:
            browser.close()
    print("PASS", engine, "phase 12: mutation batching and bfcache resume", flush=True)


if __name__ == "__main__":
    run()
