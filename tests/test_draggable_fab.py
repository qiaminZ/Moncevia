"""Draggable launcher regression: mouse, touch, viewport resize, keyboard and reset."""
from pathlib import Path
from playwright.sync_api import sync_playwright
from test_static_prices import html, init

ROOT=Path(__file__).resolve().parents[1]
SCRIPT=(ROOT/'moncevia.user.js').read_text().replace(
    "const HOST = location.hostname.toLowerCase();",
    "const HOST = 'shop.riftbot.org';"
)

def rectangle(page):
    return page.locator('#clplens-fab').bounding_box()

def in_viewport(rect,width,height):
    assert rect['x'] >= 6 and rect['y'] >= 10, rect
    assert rect['x']+rect['width'] <= width-5, rect
    assert rect['y']+rect['height'] <= height-8, rect

def new_page(browser,width,height,mobile=False,previous=None):
    page=browser.new_page(viewport={'width':width,'height':height},
        is_mobile=mobile,has_touch=mobile,locale='es-CL')
    page.set_content(html)
    page.evaluate(init)
    settings=previous or {'allowedSites':['shop.riftbot.org']}
    page.evaluate('window._persist.clplens_v1='+__import__('json').dumps(settings))
    page.add_script_tag(content=SCRIPT)
    page.wait_for_selector('#clplens-fab')
    return page

def run():
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',
            args=['--no-sandbox'])
        # Desktop mouse drag: pointer capture, persistence, keyboard and reset.
        page=new_page(browser,1366,768)
        fab=page.locator('#clplens-fab')
        initial=rectangle(page)
        start=(initial['x']+initial['width']/2,initial['y']+initial['height']/2)
        page.mouse.move(*start)
        page.mouse.down()
        page.mouse.move(180,140,steps=10)
        page.mouse.up()
        dragged=rectangle(page)
        assert abs(dragged['x']-initial['x'])>80, (initial,dragged)
        assert page.locator('#clplens-panel').is_hidden(), 'Drag must not open panel'
        page.wait_for_function('window._persist.clplens_v1?.fabPosition?.x >= 0')
        previous=page.evaluate('window._persist.clplens_v1')
        assert 0 <= previous['fabPosition']['y'] <= 1
        in_viewport(dragged,1366,768)
        # Keyboard movement is available when the launcher has focus.
        fab.focus()
        page.keyboard.press('ArrowRight')
        page.wait_for_timeout(50)
        right=rectangle(page)
        assert right['x']-dragged['x']>=14, (dragged,right)
        page.set_viewport_size({'width':320,'height':640})
        page.wait_for_timeout(100)
        in_viewport(rectangle(page),320,640)
        # Clicking still works and reset is available in settings.
        fab.click()
        assert page.locator('#clplens-panel').is_visible()
        page.get_by_role('tab',name='Ajustes').click()
        page.locator('#mv-page-settings details').first.evaluate('(el)=>el.open=true')
        page.get_by_role('button',name='Restablecer posición del botón').click()
        page.wait_for_function('window._persist.clplens_v1?.fabPosition === null')
        reset=rectangle(page)
        assert reset['x'] > 180 and reset['y'] > 500,reset
        assert page.locator('#clplens-panel').is_visible(), 'Reset should not close the panel'
        page.close()
        # Restore stored normalized coordinates on a new page and phone-sized viewport.
        mobile=new_page(browser,390,844,True,previous)
        mobile_fab=mobile.locator('#clplens-fab')
        in_viewport(rectangle(mobile),390,844)
        assert mobile_fab.evaluate("(el)=>el.classList.contains('mv-fab-moved')")
        # Touch-pointer event simulation, independent of browser mouse API.
        start=rectangle(mobile)
        x=start['x']+start['width']/2
        y=start['y']+start['height']/2
        opts={'pointerId':23,'pointerType':'touch','isPrimary':True,'button':0}
        mobile_fab.dispatch_event('pointerdown',{**opts,'clientX':x,'clientY':y})
        mobile_fab.dispatch_event('pointermove',{**opts,'clientX':x+95,'clientY':y+110})
        mobile_fab.dispatch_event('pointerup',{**opts,'clientX':x+95,'clientY':y+110})
        moved=rectangle(mobile)
        in_viewport(moved,390,844)
        assert abs(moved['y']-start['y'])>=50,(start,moved)
        assert mobile.locator('#clplens-panel').is_hidden()
        mobile.wait_for_function('window._persist.clplens_v1?.fabPosition?.y >= 0')
        # A new real tap after a drag must still open the panel.
        mobile_fab.click()
        assert mobile.locator('#clplens-panel').is_visible()
        mobile.close()
        browser.close()
        print('PASS: FAB mouse/touch drag, keyboard move, reset, persisted ratio, viewport bounds and click')

if __name__=='__main__':
    run()
