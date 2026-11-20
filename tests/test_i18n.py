from playwright.sync_api import sync_playwright
from pathlib import Path
from test_browser import HTML,INIT,S
with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':390,'height':844},locale='en-US',is_mobile=True,has_touch=True)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(HTML);page.evaluate(INIT)
  page.add_script_tag(content=Path(S).read_text().replace('const HOST = location.hostname.toLowerCase();',"const HOST = 'shop.riftbot.org';"))
  page.wait_for_selector('#clplens-fab');page.locator('#clplens-fab').click()
  assert 'Fiat rates current' in page.locator('.mv-header').inner_text()
  for tab in ['calculator','crypto','compare','history','settings']:
    page.locator('#mv-tab-'+tab).click()
    if tab=='settings':
      for d in page.locator('#mv-page-settings details').all(): d.evaluate('(el) => el.open=true')
    if tab=='crypto':
      for d in page.locator('#mv-page-crypto details').all(): d.evaluate('(el) => el.open=true')
    content=page.locator('#mv-page-'+tab).inner_text()
    expected={'calculator':'Result in CLP','crypto':'Crypto payment',
              'compare':'Compare payment methods','history':'Local history','settings':'Settings'}[tab]
    assert expected.lower() in content.lower(),(tab,content[:400])
    assert 'No envíes' not in content and 'Configuración' not in content,tab
  page.locator('.mv-lang-toggle').click()
  assert page.locator('#mv-tab-calculator').inner_text().strip().endswith('Convertir')
  assert page.locator('.mv-lang-toggle').inner_text()=='ES'
  assert page.evaluate("window._persist.clplens_v1.language")=='es'
  page.locator('.mv-lang-toggle').click()
  assert page.locator('#mv-tab-calculator').inner_text().strip().endswith('Convert')
  assert page.evaluate("window._persist.clplens_v1.language")=='en'
  langSelect=page.locator('label').filter(has_text='Idioma / Language').locator('select')
  assert langSelect.input_value()=='en'
  langSelect.select_option('auto')
  assert page.locator('#mv-tab-calculator').inner_text().strip().endswith('Convert')
  assert page.evaluate("window._persist.clplens_v1.language")=='auto'
  langSelect.select_option('en')
  # A saved English preference overrides a Spanish browser on subsequent page loads.
  restored=browser.new_page(viewport={'width':390,'height':844},locale='es-CL',is_mobile=True,has_touch=True)
  restored.set_content(HTML);restored.evaluate(INIT)
  restored.evaluate("window._persist.clplens_v1={language:'en',allowedSites:['shop.riftbot.org']}")
  restored.add_script_tag(content=Path(S).read_text().replace('const HOST = location.hostname.toLowerCase();',"const HOST = 'shop.riftbot.org';"))
  restored.wait_for_selector('#clplens-fab');restored.locator('#clplens-fab').click()
  assert restored.locator('#mv-tab-calculator').inner_text().strip().endswith('Convert')
  assert restored.locator('.mv-lang-toggle').inner_text()=='EN'
  restored.close()
  assert not errors,errors
  print('PASS language switching and persisted preference',flush=True)
  browser.close()
