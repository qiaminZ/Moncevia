"""Phase 6: reversible bilingual localization and dynamic ARIA labels.

All tests use mocked market sources and ensure the merchant page is untouched.
Cross-browser testing includes both desktop and emulated mobile viewports.
"""
from pathlib import Path
import os
from playwright.sync_api import sync_playwright
from test_browser import INIT, HTML

ROOT=Path(__file__).resolve().parents[1]
SCRIPT=(ROOT/'moncevia.user.js').read_text().replace(
    "const HOST = location.hostname.toLowerCase();",
    "const HOST = 'shop.riftbot.org';",
)

def run():
    engine=os.environ.get('MONCEVIA_TEST_BROWSER','chromium').lower()
    assert engine in ('chromium','firefox','webkit')
    with sync_playwright() as pw:
        opts={'headless':True}
        if engine=='chromium':
            opts.update(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
        browser=getattr(pw,engine).launch(**opts)
        for locale,width,height in [('es-CL',390,844),('en-US',1366,768)]:
            mobile=width<500
            page=browser.new_page(
                viewport={'width':width,'height':height},locale=locale,
                is_mobile=mobile and engine!='firefox',has_touch=mobile
            )
            errors=[]
            page.on('pageerror',lambda error:errors.append(str(error)))
            page.set_content(HTML)
            page.evaluate(INIT)
            page.add_script_tag(content=SCRIPT)
            page.wait_for_selector('#clplens-fab')
            page.locator('#clplens-fab').click()
            tab=page.locator('#mv-tab-calculator')
            expected='Convertir' if locale=='es-CL' else 'Convert'
            page.wait_for_function(
              "expected => document.querySelector('#mv-tab-calculator')?.textContent.includes(expected)",
              arg=expected, timeout=8000)
            page.evaluate("""() => {
              const panel=document.getElementById('mv-page-settings');
              const extra=document.createElement('span');
              extra.id='test-translation';
              extra.textContent='Borrar historial local';
              extra.setAttribute('aria-label','Permitir Moncevia en este dominio');
              panel.append(extra);
            }""")
            expected_text='Borrar historial local' if locale=='es-CL' else 'Clear local history'
            expected_aria='Permitir Moncevia en este dominio' if locale=='es-CL' else 'Allow Moncevia on this domain'
            page.wait_for_function(
              "text => document.querySelector('#test-translation')?.textContent === text",
              arg=expected_text,timeout=8000)
            page.wait_for_function(
              "label => document.querySelector('#test-translation')?.getAttribute('aria-label')===label",
              arg=expected_aria,timeout=8000)
            page.locator('.mv-lang-toggle').click()
            other='Convert' if locale=='es-CL' else 'Convertir'
            page.wait_for_function(
              "text => document.querySelector('#mv-tab-calculator')?.textContent.includes(text)",
              arg=other,timeout=8000)
            other_text='Clear local history' if locale=='es-CL' else 'Borrar historial local'
            page.wait_for_function(
              "text => document.querySelector('#test-translation')?.textContent === text",
              arg=other_text,timeout=8000)
            page.locator('.mv-lang-toggle').click()
            page.wait_for_function(
              "text => document.querySelector('#mv-tab-calculator')?.textContent.includes(text)",
              arg=expected,timeout=8000)
            page.wait_for_function(
              "text => document.querySelector('#test-translation')?.textContent === text",
              expected_text,timeout=8000)
            assert not errors, (engine,locale,errors)
            page.close()
        browser.close()
    print('PASS',engine,'reversible ES/EN localization, dynamic attributes and mobile/desktop',flush=True)

if __name__=='__main__':
    run()
