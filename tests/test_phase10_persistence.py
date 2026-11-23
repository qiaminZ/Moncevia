"""Phase 10: durable consent, failed storage and independent cache recovery.

Deterministic mock GM transport. Runs on Chromium, Firefox and WebKit in desktop
and phone-size emulation. No live market requests, logins or transactions.
"""
import os

from playwright.sync_api import sync_playwright
from test_browser import HTML, INIT, S

SCRIPT = open(S, encoding="utf-8").read().replace(
    "const HOST = location.hostname.toLowerCase();",
    "const HOST = 'other.example';",
)


def setup(browser, mobile=False):
    page = browser.new_page(
        viewport={"width": 390 if mobile else 1366, "height": 844 if mobile else 768},
        locale="es-CL",
        is_mobile=mobile and browser.browser_type.name != "firefox",
        has_touch=mobile,
    )
    page.set_content(HTML)
    page.evaluate(INIT)
    return page


def denied_consent(browser, mobile):
    page = setup(browser, mobile)
    alerts = []
    errors = []
    page.on("dialog", lambda d: (alerts.append(d.message), d.accept()))
    page.on("pageerror", lambda e: errors.append(str(e)))
    try:
        page.evaluate("""() => {
          const original=GM.setValue;
          GM.setValue=async (key,value)=>{
            if(key==='clplens_v1') throw new Error('Storage write blocked');
            return original(key,value);
          };
        }""")
        page.add_script_tag(content=SCRIPT)
        allow = page.locator("#moncevia-optin")
        allow.wait_for()
        assert page.evaluate("window._requests.length") == 0
        allow.click()
        page.wait_for_function("() => !document.querySelector('#moncevia-optin')?.disabled")
        assert page.locator("#clplens-widget").count() == 0
        assert page.evaluate("window._requests.length") == 0
        assert "other.example" not in page.evaluate(
            "window._persist.clplens_v1?.allowedSites || []"
        )
        assert alerts and "autorización" in alerts[-1], alerts
        assert not errors, errors
    finally:
        page.close()


def delayed_consent(browser, mobile):
    page = setup(browser, mobile)
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    try:
        page.evaluate("""() => {
          const original=GM.setValue;
          window._releaseConsent=null;
          GM.setValue=(key,value)=>{
            if(key==='clplens_v1') return new Promise(resolve=>{
              window._releaseConsent=()=>{
                window._persist[key]=value;
                resolve(true);
              };
            });
            return original(key,value);
          };
        }""")
        page.add_script_tag(content=SCRIPT)
        allow = page.locator("#moncevia-optin")
        allow.wait_for()
        allow.click()
        page.wait_for_function("() => typeof window._releaseConsent === 'function'")
        assert allow.is_disabled()
        assert page.locator("#clplens-widget").count() == 0
        assert page.evaluate("window._requests.length") == 0
        page.evaluate("window._releaseConsent()")
        page.locator("#clplens-fab").wait_for(timeout=12000)
        assert page.evaluate("window._persist.clplens_v1.allowedSites.includes('other.example')")
        page.wait_for_function("() => window._requests.length > 0", timeout=12000)
        assert not errors, errors
    finally:
        page.close()


def isolated_cache_failure(browser, mobile):
    page = setup(browser, mobile)
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    try:
        page.evaluate("""() => {
          window._persist.clplens_v1={
            allowedSites:['other.example'],
            language:'en',
            calcCurrency:'EUR',
            calcAmount:'55'
          };
          window._persist.clplens_history_v3=[{
            at:1720000000000,code:'EUR',amount:45,clp:45000,
            site:'no guardado'
          }];
          const original=GM.getValue;
          GM.getValue=(key,fallback)=>{
            if(key==='clplens_usd_rates_v1') return Promise.reject(new Error('Broken FX cache'));
            return original(key,fallback);
          };
        }""")
        page.add_script_tag(content=SCRIPT)
        page.locator("#clplens-fab").wait_for(timeout=12000)
        page.locator("#clplens-fab").click()
        page.locator("#mv-tab-history").click()
        # The restored history entry is the invariant; the translated button
        # label can be updated asynchronously by the UI localizer.
        record = page.locator("#mv-page-history .clplens-record")
        record.wait_for(timeout=8000)
        assert record.count() == 1
        assert "45 EUR" in record.inner_text()
        assert record.locator("button").count() == 1
        assert page.locator("#mv-tab-history").get_attribute("aria-selected") == "true"
        assert "other.example" in page.evaluate(
            "window._persist.clplens_v1.allowedSites"
        )
        assert not errors, errors
    finally:
        page.close()


def history_clear_save_race(browser):
    page = setup(browser, False)
    page.on("dialog", lambda d: d.accept())
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    try:
        page.evaluate("""() => {
          window._persist.clplens_v1 = {allowedSites:['other.example']};
          window._persist.clplens_history_v3 = [{
            at:1720000000000,code:'EUR',amount:12,clp:12000,
            site:'old.example'
          }];
          const original=GM.setValue;
          window._releaseClear=null;
          GM.setValue=(key,value)=>{
            if(key==='clplens_history_v3' &&
               Array.isArray(value) && value.length===0) {
              return new Promise(resolve=>{
                window._releaseClear=()=>{
                  window._persist[key]=value;
                  resolve(true);
                };
              });
            }
            return original(key,value);
          };
        }""")
        page.add_script_tag(content=SCRIPT)
        page.locator("#clplens-fab").wait_for(timeout=12000)
        page.locator("#clplens-fab").click()
        page.locator("#mv-tab-history").click()
        assert page.get_by_role("button", name="Reutilizar").count() == 1
        page.get_by_role("button", name="Borrar historial local").click()
        page.wait_for_function("() => typeof window._releaseClear === 'function'")
        assert page.get_by_role("button", name="Reutilizar").count() == 0

        # The user can save a new query while the clear write is pending.
        # The mocked FX provider must be ready before saving a CLP estimate.
        page.wait_for_function(
            "() => window._persist.clplens_usd_rates_v1?.rates?.CLP > 0",
            timeout=12000,
        )
        page.locator("#mv-tab-calculator").click()
        page.get_by_role("button", name="Guardar", exact=True).click()
        page.locator("#mv-tab-history").click()
        assert page.get_by_role("button", name="Reutilizar").count() == 1
        assert "old.example" not in page.locator("#mv-page-history").inner_text()

        page.evaluate("window._releaseClear()")
        page.wait_for_function(
            """() => window._persist.clplens_history_v3?.length === 1 &&
            window._persist.clplens_history_v3[0].site === 'no guardado'""",
            timeout=12000,
        )
        assert "old.example" not in page.locator("#mv-page-history").inner_text()
        assert page.get_by_role("button", name="Reutilizar").count() == 1
        assert not errors, errors
    finally:
        page.close()


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
                denied_consent(browser, mobile)
                delayed_consent(browser, mobile)
                isolated_cache_failure(browser, mobile)
            history_clear_save_race(browser)
        finally:
            browser.close()
    print("PASS", engine, "phase 10: durable site consent and independent cache recovery", flush=True)


if __name__ == "__main__":
    run()
