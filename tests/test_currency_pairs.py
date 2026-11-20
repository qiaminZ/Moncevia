"""Cross-currency regression on a generic authorized web shop, not RIFT."""
from pathlib import Path
from playwright.sync_api import sync_playwright
from test_browser import INIT, ROOT

SCRIPT=(ROOT/'moncevia.user.js').read_text().replace(
 "const HOST = location.hostname.toLowerCase();","const HOST = 'example.com';")
DATA=INIT.replace('"GBP": 0.75}', '"GBP": 0.75, "JPY": 150, "KRW": 1350, "CAD": 1.4, "AUD": 1.5, "BRL": 5, "CNY": 7.2}')

def test():
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  for lang in ['es-CL','en-US']:
   page=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,locale=lang)
   errors=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content('<html><body><p>GBP 20.00</p></body></html>')
   page.evaluate(DATA)
   page.evaluate("window._persist.clplens_v1={allowedSites:['example.com'],calcCurrency:'CLP',calcAmount:'2000'}")
   page.add_script_tag(content=SCRIPT)
   page.wait_for_selector('#clplens-fab')
   page.wait_for_function("window._persist.clplens_usd_rates_v1?.rates?.CLP > 0")
   page.wait_for_function("window._persist.clplens_crypto_rates_v2?.usd?.BTC > 0")
   page.locator('#clplens-fab').click()
   source=page.locator('#mv-page-calculator .clplens-inputrow select').first
   target=page.locator('#mv-page-calculator .mv-target-row select')
   amount=page.locator('#mv-page-calculator .clplens-inputrow input').first
   result=page.locator('#mv-page-calculator .mv-hero .mv-big')
   assert source.input_value()=='CLP' and target.input_value()=='USD'
   assert '2,00' in result.inner_text() or '2.00' in result.inner_text()
   target.select_option('EUR')
   assert '1,80' in result.inner_text() or '1.80' in result.inner_text()
   source.select_option('EUR'); amount.fill('10');target.select_option('GBP')
   assert '8,33' in result.inner_text() or '8.33' in result.inner_text()
   target.select_option('JPY')
   assert '1.667' in result.inner_text() or '1,667' in result.inner_text()
   source.select_option('LTC');target.select_option('EUR');amount.fill('1')
   assert result.inner_text().startswith('EUR ')
   target.select_option('USD');page.locator('.mv-swap').click()
   assert source.input_value()=='USD' and target.input_value()=='LTC'
   assert page.evaluate('window._persist.clplens_v1.targetCurrency')=='LTC'
   assert not errors, errors
   page.close()
  browser.close()
 print('PASS generic site: CLP, USD, EUR, GBP, JPY and LTC pair conversion, swap and i18n')

if __name__=='__main__':test()
