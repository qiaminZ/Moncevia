"""Viewport, keyboard navigation and responsive panel regression tests.

Runs on all three browser engines; these are browser-emulated screen sizes,
not a claim of physical-device certification.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from test_static_prices import init, html
import os, json

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = (ROOT / 'moncevia.user.js').read_text().replace(
    "const HOST = location.hostname.toLowerCase();", "const HOST = 'shop.riftbot.org';"
)
VIEWPORTS = [
    (320, 568), (375, 667), (390, 844),
    (768, 1024), (1024, 768), (1366, 768),
    (844, 390), (667, 375), (320, 320), (1440, 900),
]

def run():
    engine=os.environ.get('MONCEVIA_TEST_BROWSER','chromium').lower()
    assert engine in ('chromium','firefox','webkit')
    with sync_playwright() as playwright:
        args={'headless':True}
        if engine=='chromium':
            args.update(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
        browser=getattr(playwright,engine).launch(**args)
        for width,height in VIEWPORTS:
            is_phone=width<=420
            page=browser.new_page(
                viewport={'width':width,'height':height},
                is_mobile=is_phone and engine!='firefox',
                has_touch=is_phone,locale='es-CL'
            )
            errors=[]
            page.on('pageerror',lambda error:errors.append(str(error)))
            page.set_content(html)
            page.evaluate(init)
            page.evaluate("window._persist.clplens_v1="+json.dumps({
                'allowedSites':['shop.riftbot.org'],'targetCurrency':'CLP'
            }))
            page.add_script_tag(content=SCRIPT)
            page.wait_for_selector('#clplens-fab')
            fab=page.locator('#clplens-fab')
            assert fab.get_attribute('aria-expanded')=='false'
            fab.click()
            panel=page.locator('#clplens-panel')
            panel.wait_for(state='visible')
            page.wait_for_function("document.getElementById('clplens-fab').getAttribute('aria-expanded')==='true'")
            box=panel.bounding_box()
            assert box, (engine,width,height,'missing box')
            # No clipping beyond viewport, with small allowance for subpixel rounding.
            assert box['x']>=-2 and box['y']>=-2, (engine,width,height,box)
            assert box['x']+box['width']<=width+2, (engine,width,height,box)
            assert box['y']+box['height']<=height+2, (engine,width,height,box)
            # Main content scrolls inside Moncevia, not by pushing the merchant's page.
            dimensions=page.evaluate("""() => {
              const p=document.getElementById('clplens-panel');
              return {scroll:p.scrollHeight,client:p.clientHeight,overflow:getComputedStyle(p).overflowY};
            }""")
            assert dimensions['client']>45, (engine,width,height,dimensions)
            assert dimensions['overflow'] in ('auto','scroll'), dimensions
            # Tab roles, keyboard roving tabindex, and Escape across orientations.
            page.locator('#mv-tab-calculator').focus()
            page.keyboard.press('End')
            assert page.locator('#mv-tab-settings').get_attribute('aria-selected')=='true'
            page.keyboard.press('Home')
            assert page.locator('#mv-tab-calculator').get_attribute('aria-selected')=='true'
            page.keyboard.press('ArrowRight')
            assert page.locator('#mv-tab-crypto').get_attribute('aria-selected')=='true'
            page.keyboard.press('Escape')
            panel.wait_for(state='hidden')
            page.wait_for_function("document.getElementById('clplens-fab').getAttribute('aria-expanded')==='false'")
            assert not errors, (engine,width,height,errors)
            page.close()
        browser.close()
        print('PASS:',engine,len(VIEWPORTS),'responsive viewports and accessible tab navigation')

if __name__=='__main__':
    run()
