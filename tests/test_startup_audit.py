"""Actual RIFT hostname and failure-injection regressions.

Playwright injects the built script; this is not a physical Safari Userscripts
installation. All market traffic uses test_browser.INIT, never live accounts.
"""
import os
from pathlib import Path

from playwright.sync_api import sync_playwright
from test_browser import INIT

SCRIPT = (Path(__file__).resolve().parents[1] / "moncevia.user.js").read_text(encoding="utf-8")
HOST = "shop.riftbots.org"
HTML = """<!doctype html><html><head><meta charset="utf-8"></head><body>
<main><h1>Test shop</h1><p id="price">€24.99</p></main>
<aside hidden><input type="password"></aside></body></html>"""


def exercise(browser, engine, mobile, case):
    page = browser.new_page(
        viewport={"width": 390 if mobile else 1280, "height": 844 if mobile else 800},
        has_touch=mobile,
        is_mobile=mobile and engine != "firefox",
        locale="es-CL",
    )
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    try:
        host = "shop.example.cl" if case == "blocked-cl" else HOST
        path = "/checkout" if case == "checkout" else "/products/riftbot-base"
        page.route("**/*", lambda route: route.fulfill(
            status=200, content_type="text/html; charset=utf-8", body=HTML))
        page.goto("https://" + host + path)
        page.evaluate(INIT)
        page.evaluate("window._persist.clplens_v1={allowedSites:[]}")
        if case == "password":
            page.locator("aside").evaluate("el => el.hidden=false")
        if case in ("hung", "late", "reject"):
            page.evaluate("""(mode) => {
                const original=GM.getValue.bind(GM);
                GM.getValue=(key,fallback)=>{
                    if(key==='clplens_v1'){
                        if(mode==='reject') return Promise.reject(new Error('denied'));
                        if(mode==='late') return new Promise(resolve=>{
                            window.releaseStartup=()=>resolve({allowedSites:['shop.riftbots.org']});
                        });
                        return new Promise(()=>{});
                    }
                    return original(key,fallback);
                };
            }""", case)
        page.add_script_tag(content=SCRIPT)
        if case == "duplicate":
            page.add_script_tag(content=SCRIPT)
        if case in ("checkout", "password", "blocked-cl"):
            page.wait_for_timeout(300)
            assert page.locator("#moncevia-optin,#clplens-widget,#moncevia-startup-error").count() == 0
        elif case in ("hung", "late", "reject"):
            page.locator("#moncevia-startup-error").wait_for(timeout=8500)
            assert page.locator("#moncevia-startup-error").count() == 1
            assert page.locator("#moncevia-optin,#clplens-widget").count() == 0
            if case == "late":
                page.evaluate("window.releaseStartup()")
                page.wait_for_timeout(350)
                assert page.locator("#moncevia-optin,#clplens-widget").count() == 0
        else:
            consent = page.locator("#moncevia-optin")
            consent.wait_for(timeout=8500)
            page.wait_for_timeout(350)
            assert consent.count() == 1
            assert page.locator("#moncevia-startup-error,#clplens-widget").count() == 0
        assert page.evaluate("window._requests.length") == 0
        assert not errors, (engine, mobile, case, errors)
        if case == "consent":
            consent.click()
            page.locator("#clplens-fab").wait_for(timeout=12000)
            page.wait_for_function("() => window._requests.length > 0", timeout=12000)
            page.wait_for_function("() => document.querySelector('#price .clplens-badge')?.textContent?.startsWith('≈')", timeout=12000)
            assert page.locator("#price").evaluate("el=>el.firstChild.nodeValue") == "€24.99"
            assert page.evaluate("window._persist.clplens_v1.allowedSites.includes('shop.riftbots.org')")
            assert not errors, errors
    finally:
        page.close()


def run():
    engine = os.environ.get("MONCEVIA_TEST_BROWSER", "chromium")
    with sync_playwright() as playwright:
        opts = {"headless": True}
        if engine == "chromium":
            opts.update(executable_path="/usr/bin/chromium", args=["--no-sandbox"])
        browser = getattr(playwright, engine).launch(**opts)
        try:
            for mobile in (False, True):
                for case in ("consent", "duplicate", "hung", "late", "reject", "checkout", "password", "blocked-cl"):
                    exercise(browser, engine, mobile, case)
        finally:
            browser.close()
    print("PASS", engine, "16 startup scenarios (desktop and mobile emulation)", flush=True)


if __name__ == "__main__":
    run()
