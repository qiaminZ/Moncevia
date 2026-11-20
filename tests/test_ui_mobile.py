"""UI layout regression for Moncevia v3.3.0.
Uses deterministic mocked data; no live market APIs or payment execution.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from test_browser import HTML,INIT,ROOT


def run():
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  for width,height in [(320,640),(375,812),(390,844),(568,320)]:
   page=browser.new_page(viewport={'width':width,'height':height},is_mobile=True,has_touch=True)
   errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
   page.set_content(HTML);page.evaluate(INIT)
   page.add_script_tag(content=(ROOT/'moncevia.user.js').read_text().replace('const HOST = location.hostname.toLowerCase();',"const HOST = 'shop.riftbot.org';"))
   page.wait_for_selector('#clplens-fab');page.locator('#clplens-fab').click()
   tabs=page.get_by_role('tab')
   assert tabs.count()==5, tabs.count()
   for label in ('Convertir','Pagar','Comparar','Historial','Ajustes'):
    page.get_by_role('tab',name=label).click()
    assert page.get_by_role('tab',name=label).get_attribute('aria-selected')=='true'
    # Dialog must never overflow viewport in either direction.
    box=page.locator('#clplens-panel').bounding_box()
    assert box['x']>=-1 and box['x']+box['width']<=width+1,(width,label,box)
    assert box['y']>=-1 and box['y']+box['height']<=height+1,(width,label,box)
    inner=page.locator('#clplens-panel').evaluate('(el)=>({scrollWidth:el.scrollWidth,clientWidth:el.clientWidth})')
    assert inner['scrollWidth']<=inner['clientWidth']+2,(width,label,inner)
   assert not errors,(width,errors)
   page.close()
  browser.close()
 print('PASS: 5-view navigation, viewport containment at 320, 375, 390px and landscape; no JS errors')

if __name__=='__main__': run()
