"""Phase 5 browser integration: unauthorized sites stay silent; malformed exchange
quotes fall back without creating fictitious Binance bid/ask estimates.

All market replies are mocked. No real credentials, orders or transfers.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from test_browser import INIT, HTML

ROOT=Path(__file__).resolve().parents[1]
SCRIPT=(ROOT/'moncevia.user.js').read_text().replace(
    "const HOST = location.hostname.toLowerCase();",
    "const HOST = 'shop.riftbot.org';",
)

def run():
    with sync_playwright() as p:
        browser=p.chromium.launch(
            headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox']
        )
        page=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
        page.set_content(HTML)
        page.evaluate(INIT)
        page.evaluate("""() => {
          window._persist.clplens_v1={
            allowedSites:'INVALID',disabledSites:['bad host with spaces'],
            dollarCurrencySites:{'bad site':'USD'},
            language:'xx',calcCurrency:'UNSUPPORTED',targetCurrency:'UNSUPPORTED',
            feeBTC:-999,unknownPrivilege:'grant'
          };
        }""")
        page.add_script_tag(content=SCRIPT)
        page.wait_for_selector('#moncevia-optin')
        assert page.locator('#clplens-fab').count()==0
        assert page.evaluate('window._requests.length')==0, 'Unconsented site triggered market API'
        page.locator('#moncevia-optin').click()
        page.wait_for_selector('#clplens-fab')
        page.wait_for_function("window._persist.clplens_crypto_rates_v2?.usdtUsd>0",timeout=12000)
        saved=page.evaluate('window._persist.clplens_v1')
        assert saved['allowedSites']==['shop.riftbot.org'],saved
        assert 'unknownPrivilege' not in saved,saved
        assert saved['feeBTC']==0,saved
        assert saved['language']=='auto',saved
        page.close()

        # A malformed Binance bid/ask is rejected: the price must come from a
        # separately validated CoinGecko fallback, not the broken bookTicker.
        page=browser.new_page(viewport={'width':1366,'height':768})
        page.set_content(HTML)
        page.evaluate(INIT)
        page.evaluate("""() => {
          window._persist.clplens_v1={allowedSites:['shop.riftbot.org']};
          const old=window.GM.xmlHttpRequest;
          window.GM.xmlHttpRequest=async opts => {
            if (opts.url.includes('bookTicker') && opts.url.includes('BTCUSDT'))
              return {status:200,responseText:JSON.stringify({
                symbol:'BTCUSDT',askPrice:'999',bidPrice:'1000'
              })};
            return old(opts);
          };
        }""")
        page.add_script_tag(content=SCRIPT)
        page.wait_for_function("""() => window._persist.clplens_crypto_rates_v2?.source?.startsWith('CoinGecko')""",timeout=12000)
        snapshot=page.evaluate('window._persist.clplens_crypto_rates_v2')
        assert snapshot['source'].startswith('CoinGecko'),snapshot
        assert 'askUSDT' not in snapshot,snapshot
        assert snapshot['usd']['BTC']>0,snapshot
        page.close()
        browser.close()
    print('PASS: phase 5 domain-consent isolation, corrupt settings, Binance-to-CoinGecko fallback')

if __name__=='__main__':
    run()
