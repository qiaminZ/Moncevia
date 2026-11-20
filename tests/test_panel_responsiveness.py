"""Regression: opening the panel does not rebuild conversion and history synchronously."""
from pathlib import Path
from playwright.sync_api import sync_playwright
from test_static_prices import html, init

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = (ROOT / "moncevia.user.js").read_text().replace(
    "const HOST = location.hostname.toLowerCase();", "const HOST = 'shop.riftbot.org';"
)

def run():
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(
            headless=True, executable_path="/usr/bin/chromium", args=["--no-sandbox"]
        )
        for width, height, mobile in [(390, 844, True), (1366, 768, False)]:
            page = browser.new_page(
                viewport={"width": width, "height": height},
                is_mobile=mobile, has_touch=mobile, locale="en-US"
            )
            errors = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.set_content(html)
            page.evaluate(init)
            page.evaluate("""() => {
                window._persist.clplens_v1 = {allowedSites:['shop.riftbot.org']};
                window._persist.clplens_history_v3 = Array.from(
                    {length:30},(_,i)=>({at:Date.now()-i*100000, amount:i+1,
                        code:'EUR',clp:1200*(i+1),site:'no guardado'}));
            }""")
            page.add_script_tag(content=SCRIPT)
            page.wait_for_selector("#clplens-fab")
            page.wait_for_function("window._persist.clplens_crypto_rates_v2?.usdtUsd>0")
            page.wait_for_timeout(800)
            sample = page.evaluate("""() => {
                let redraws=0;
                const original=Node.prototype.replaceChildren;
                Node.prototype.replaceChildren=function(...args) {
                    if(this.closest?.('#clplens-widget')) redraws++;
                    return original.apply(this,args);
                };
                const fab=document.getElementById('clplens-fab');
                const panel=document.getElementById('clplens-panel');
                const start=performance.now();
                fab.click();
                const blockingMs=performance.now()-start;
                return {shown: !panel.hidden, redraws, blockingMs};
            }""")
            assert sample["shown"] and sample["redraws"] == 0, sample
            page.wait_for_timeout(300)
            assert page.locator("#clplens-panel").is_visible()
            assert page.locator(".mv-hero").is_visible()
            page.locator("#clplens-fab").click()
            assert page.locator("#clplens-panel").is_hidden()
            assert not errors, errors
            print(f"PASS {width}px: synchronous panel redraws=0, click handler {sample['blockingMs']:.2f} ms")
            page.close()
        browser.close()

if __name__ == "__main__":
    run()
