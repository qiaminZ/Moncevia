"""Cross-platform GM API smoke tests: modern Promise, callback, legacy, and desktop UI."""
from pathlib import Path
from playwright.sync_api import sync_playwright
from test_browser import INIT, HTML

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = (ROOT / "moncevia.user.js").read_text().replace(
    "const HOST = location.hostname.toLowerCase();",
    "const HOST = 'shop.riftbot.org';",
)

CALLBACK = """
window._xhr=window.GM.xmlHttpRequest;
window.GM.xmlHttpRequest=(opts)=>{window._xhr(opts).then(r=>opts.onload(r), e=>opts.onerror(e));return {abort(){}};};
"""
LEGACY = """
window._xhr=window.GM.xmlHttpRequest;
window.GM_getValue=(k,d)=>window._persist[k]??d;
window.GM_setValue=(k,v)=>{window._persist[k]=v;};
window.GM_xmlhttpRequest=(opts)=>{window._xhr(opts).then(r=>opts.onload(r), e=>opts.onerror(e));return {abort(){}};};
delete window.GM;
"""

def run():
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(
            headless=True, executable_path="/usr/bin/chromium", args=["--no-sandbox"]
        )
        for api, width, height, mobile in [
            ("modern", 390, 844, True),
            ("callback", 390, 844, True),
            ("legacy", 390, 844, True),
            ("modern", 1440, 900, False),
            ("legacy", 1366, 768, False),
        ]:
            page = browser.new_page(
                viewport={"width": width, "height": height},
                is_mobile=mobile, has_touch=mobile, locale="es-CL"
            )
            errors = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.set_content(HTML)
            page.evaluate(INIT)
            if api == "callback": page.add_script_tag(content=CALLBACK)
            if api == "legacy": page.add_script_tag(content=LEGACY)
            page.add_script_tag(content=SCRIPT)
            page.wait_for_selector("#clplens-fab")
            page.wait_for_function(
                "window._persist.clplens_crypto_rates_v2?.usdtUsd>0", timeout=10000
            )
            page.locator("#clplens-fab").click()
            assert page.get_by_role("tab", name="Convertir").is_visible()
            assert page.get_by_role("tab", name="Pagar").count() == 1
            page.get_by_role("tab", name="Pagar").click()
            assert page.get_by_text("Pago con criptomonedas").is_visible()
            box = page.locator("#clplens-panel").evaluate(
                "e=>{let r=e.getBoundingClientRect();return {left:r.left,right:r.right,width:r.width}}"
            )
            assert box["left"] >= -1 and box["right"] <= width + 1, (api, width, box)
            if not mobile: assert box["width"] >= 440, box
            assert not errors, (api, errors)
            page.close()
        browser.close()
        print("PASS modern Promise, callback, legacy GM APIs and desktop/mobile viewports")

if __name__ == "__main__":
    run()
