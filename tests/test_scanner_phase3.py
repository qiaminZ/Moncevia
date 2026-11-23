"""DOM scanner: inline badges do not duplicate or intercept merchant controls."""
from pathlib import Path
from playwright.sync_api import sync_playwright
from test_static_prices import init
import json

ROOT=Path(__file__).resolve().parents[1]
SCRIPT=(ROOT/'moncevia.user.js').read_text().replace(
    "const HOST = location.hostname.toLowerCase();","const HOST = 'shop.riftbot.org';"
)

def run():
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
        products=''.join(f'<article><p class="store-price" id="price{i}">€{i+10}.50</p></article>'
                         for i in range(60))
        page=browser.new_page(viewport={'width':1280,'height':800})
        page.set_content('<html><body><main><h1>Catalog</h1>'+products+
            '<button id="buy" onclick="window.buyCount=(window.buyCount||0)+1">Purchase</button></main></body></html>')
        page.evaluate(init)
        page.evaluate("window._persist.clplens_v1="+json.dumps(
            {'allowedSites':['shop.riftbot.org']}))
        page.add_script_tag(content=SCRIPT)
        page.wait_for_selector('#clplens-fab')
        page.wait_for_function("document.querySelectorAll('.clplens-badge').length >= 50",timeout=12000)
        count=page.locator('.clplens-badge').count()
        assert count==60,count
        # The scanner must not duplicate annotations on repeated mutations.
        page.evaluate("""() => {
          for(let i=0;i<10;i++) document.getElementById('price'+i).append(document.createTextNode(' '));
        }""")
        page.wait_for_timeout(800)
        assert page.locator('.clplens-badge').count()==60
        page.locator('#price0').evaluate("(e)=>e.firstChild.textContent='€99.50'")
        page.wait_for_function("document.querySelector('#price0 .clplens-badge')?.textContent.includes('99')===true",timeout=4000)
        # All displayed badges stay passive; merchant purchase controls still execute.
        page.locator('#buy').click()
        assert page.evaluate('window.buyCount')==1
        assert page.locator('.clplens-badge').count()==60
        page.close()
        browser.close()
        print('PASS: 60 price badges, mutations, updated values and merchant click preserved')

if __name__=='__main__':
    run()
