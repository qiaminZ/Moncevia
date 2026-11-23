"""Phase 8: typed FAB integration in 3 engines and two viewport profiles."""
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
        args = {"headless": True}
        if engine == "chromium":
            args.update(executable_path="/usr/bin/chromium", args=["--no-sandbox"])
        browser = getattr(playwright, engine).launch(**args)
        try:
            for mobile in (False, True):
                width, height = (390, 844) if mobile else (1366, 768)
                page = browser.new_page(
                    viewport={"width": width, "height": height},
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
                    fab = page.locator("#clplens-fab")
                    fab.wait_for(timeout=12000)
                    original = fab.bounding_box()
                    fab.focus()
                    page.keyboard.press("ArrowLeft")
                    page.wait_for_function(
                        """() => window._persist.clplens_v1?.fabPosition?.x >= 0""",
                        timeout=8000,
                    )
                    moved = fab.bounding_box()
                    assert original["x"] - moved["x"] >= 14, (engine, mobile, original, moved)

                    page.set_viewport_size({"width": 320, "height": 640})
                    page.wait_for_timeout(250)
                    current = fab.bounding_box()
                    assert current["x"] >= 6 and current["y"] >= 10, current
                    assert current["x"] + current["width"] <= 315, current
                    assert current["y"] + current["height"] <= 632, current

                    fab.click()
                    assert page.locator("#clplens-panel").is_visible()
                    page.locator("#mv-tab-settings").click()
                    page.locator("#mv-page-settings details").first.evaluate("(el)=>el.open=true")
                    page.get_by_role("button", name="Restablecer posición del botón").click()
                    page.wait_for_function(
                        """() => window._persist.clplens_v1?.fabPosition === null""",
                        timeout=8000,
                    )
                    assert page.locator("#clplens-panel").is_visible()
                    assert not errors, (engine, mobile, errors)
                finally:
                    page.close()
        finally:
            browser.close()
    print("PASS", engine, "phase 8 launcher restore/reset/keyboard/resize on desktop and mobile", flush=True)


if __name__ == "__main__":
    run()
