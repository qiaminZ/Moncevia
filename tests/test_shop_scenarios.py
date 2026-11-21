"""Cross-site DOM scenarios for dynamic price selection; no actual stores, payments or accounts.

Fixtures model patterns seen in Kumori and RIFT and ordinary e-commerce structures
(button cards, separate main price, Shopify-like select, quantities, discounts).
One failure must not prevent the other scenarios from running.
"""
from pathlib import Path
import json, os, traceback
from playwright.sync_api import sync_playwright
from test_static_prices import init

ROOT=Path(__file__).resolve().parents[1]
SCRIPT=(ROOT/'moncevia.user.js').read_text().replace(
    "const HOST = location.hostname.toLowerCase();", "const HOST = 'shop.riftbot.org';"
)
HOST='shop.riftbot.org'
HTML_HEAD='<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>'
HTML_TAIL='</body></html>'
CONFIG={'allowedSites':[HOST],'dollarCurrencySites':{HOST:'USD'}}
AMOUNT="#clplens-panel .clplens-inputrow input"

def setup(browser,html,*,width=1366,height=768,mobile=False,config=None):
    page=browser.new_page(viewport={'width':width,'height':height},
        has_touch=mobile,is_mobile=(mobile and browser.browser_type.name!='firefox'),locale='en-US')
    page.set_content(HTML_HEAD+html+HTML_TAIL)
    page.evaluate(init)
    page.evaluate('window._persist.clplens_v1='+json.dumps(config or CONFIG))
    page.add_script_tag(content=SCRIPT)
    page.wait_for_selector('#clplens-fab')
    page.wait_for_function("window._persist.clplens_crypto_rates_v2?.usdtUsd>0",timeout=12000)
    return page

def expect_amount(page,amount,timeout=3500):
    try:
        page.wait_for_function("""expected => document.querySelector(
          '#clplens-panel .clplens-inputrow input')?.value === expected
        """,arg=str(amount),timeout=timeout)
    except Exception:
        raise AssertionError(f"Expected amount={amount}; got={page.locator(AMOUNT).first.input_value()}")

def set_manual(page,value):
    page.locator('#clplens-fab').click()
    page.locator(AMOUNT).first.fill(str(value))
    page.locator('#clplens-fab').click()
    expect_amount(page,value)

def scenario_nested_card(browser,mobile):
    html="""<main><h1>Product</h1><div class="variants">
    <div class="variant-card" id="v10"><button type="button"><strong>1 Day License</strong></button><span class="variant-price">$10.00</span></div>
    <div class="variant-card" id="v25"><button type="button"><strong>3 Day License</strong></button><span class="variant-price">$25.00</span></div>
    <div class="variant-card" id="v55"><button type="button"><strong>2 Week License</strong></button><span class="variant-price">$55.00</span></div>
    </div><button id="purchase">Purchase</button>
    <script>document.querySelectorAll('.variant-card button').forEach(b=>b.onclick=()=>{
      document.querySelectorAll('.variant-card').forEach(v=>v.classList.remove('selected'));
      b.parentElement.classList.add('selected');
    });</script></main>"""
    p=setup(browser,html,mobile=mobile,width=390 if mobile else 1366)
    try:
        set_manual(p,24.99)
        p.locator('#v25 button strong').click()
        expect_amount(p,25)
        p.locator('#v55 button strong').click()
        expect_amount(p,55)
        assert p.locator('#v55').evaluate("e=>e.classList.contains('selected')")
    finally:p.close()

def scenario_text_only_variant(browser,mobile):
    html="""<main><h1>Product</h1><div class="product-info">
      <strong data-testid="product-price">$10.00</strong>
      <div aria-label="Variant" class="variant-choices">
       <button data-variant="1day">1 Day License</button>
       <button data-variant="3day">3 Day License</button>
       <button data-variant="2weeks">2 Weeks License</button>
      </div>
      </div><script>const table={day:'10.00','1day':'10.00','3day':'25.00','2weeks':'55.00'};
      document.querySelectorAll('button[data-variant]').forEach(b=>b.onclick=()=>{
        setTimeout(()=>{document.querySelector('[data-testid=product-price]').textContent='$'+table[b.dataset.variant];
          document.querySelectorAll('button[data-variant]').forEach(c=>c.setAttribute('aria-pressed',String(c===b)));
        },110);
      });</script></main>"""
    p=setup(browser,html,mobile=mobile,width=390 if mobile else 1366)
    try:
        set_manual(p,24.99)
        p.locator('[data-variant="3day"]').click()
        expect_amount(p,25)
        p.locator('[data-variant="2weeks"]').click()
        expect_amount(p,55)
    finally:p.close()

def scenario_async_race(browser,mobile):
    html="""<main><div data-testid="product-price">$10</div>
      <section class="variant-options">
       <button data-variant="25">3 Day License</button>
       <button data-variant="55">2 Week License</button>
       <button data-variant="110">1 Month License</button>
      </section>
      <script>document.querySelectorAll('[data-variant]').forEach(b=>b.onclick=()=>{
        const value=b.dataset.variant,delay=value==='25'?350:value==='55'?220:80;
        setTimeout(()=>{ if(value==='25' && document.querySelector('[data-testid=product-price]').dataset.locked) return;
          document.querySelector('[data-testid=product-price]').textContent='$'+value;
          if(value==='110') document.querySelector('[data-testid=product-price]').dataset.locked='1';
        },delay);
      });</script></main>"""
    p=setup(browser,html,mobile=mobile,width=390 if mobile else 1366)
    try:
        p.locator('[data-variant="25"]').click()
        p.locator('[data-variant="110"]').click()
        expect_amount(p,110,timeout=3000)
        p.wait_for_timeout(1500)
        expect_amount(p,110,timeout=100)
    finally:p.close()

def scenario_shopify_select(browser,mobile):
    html="""<main><div class="product__price">$10.00</div>
      <label for="variants">Variant</label>
      <select id="variants"><option value="10">Small</option><option value="25">Medium</option><option value="55">Large</option></select>
      <script>document.querySelector('#variants').addEventListener('change',e=>{
        setTimeout(()=>document.querySelector('.product__price').textContent='$'+e.target.value+'.00',130);
      });</script></main>"""
    p=setup(browser,html,mobile=mobile,width=390 if mobile else 1366)
    try:
        set_manual(p,99)
        p.locator('#variants').select_option('25')
        expect_amount(p,25)
        p.locator('#variants').select_option('55')
        expect_amount(p,55)
    finally:p.close()

def scenario_quantity(browser,mobile):
    html="""<main><span class="product-price">$10.00</span>
     <div class="quantity"><button id="minus">−</button><span id="qty">1</span><button id="plus">+</button></div>
     <script>let count=1;for(const key of ['plus','minus'])document.querySelector('#'+key).onclick=()=>{
       count=Math.max(1,count+(key==='plus'?1:-1));
       setTimeout(()=>{document.querySelector('.product-price').textContent='$'+(10*count)+'.00';
       document.querySelector('#qty').textContent=count},40);
     };</script></main>"""
    p=setup(browser,html,mobile=mobile,width=390 if mobile else 1366)
    try:
        p.locator('#plus').click()
        expect_amount(p,20)
        p.locator('#plus').click()
        expect_amount(p,30)
        p.locator('#minus').click()
        expect_amount(p,20)
    finally:p.close()

def scenario_discounts(browser,mobile):
    html="""<main><section class="product">
      <div data-testid="product-price"><del>Regular $90.00</del><span class="price--current">$70.00</span></div>
      <div class="variant-options"><button data-variant="sale">Discounted License</button></div>
    </section></main>"""
    p=setup(browser,html,mobile=mobile,width=390 if mobile else 1366)
    try:
        p.locator('[data-variant=sale]').click()
        expect_amount(p,70)
    finally:p.close()

def scenario_multiple_products(browser,mobile):
    html="""<main><div class="grid">
      <article><div class="price">$11.00</div><button id="first">Details</button></article>
      <article><div class="price">$22.00</div><button id="second">Details</button></article>
      <article><div class="price">$33.00</div><button id="third">Details</button></article>
    </div><button id="help">Help</button></main>"""
    p=setup(browser,html,mobile=mobile,width=390 if mobile else 1366)
    try:
        set_manual(p,73)
        p.locator('#help').click()
        p.wait_for_timeout(350)
        expect_amount(p,73)
        p.locator('#second').click()
        expect_amount(p,22)
        p.locator('#first').click()
        expect_amount(p,11)
    finally:p.close()

def scenario_currency_and_format(browser,mobile):
    html="""<main><article id="euro"><button><span>Tier A</span> <strong>€49,99</strong></button></article>
      <article id="pound"><button><span>Tier B</span> <strong>£17.50</strong></button></article>
      <article id="cad"><button><span>Tier C</span> <strong>CAD 30.50</strong></button></article>
      </main>"""
    p=setup(browser,html,mobile=mobile,width=390 if mobile else 1366)
    try:
        for tag,amount,currency in [('euro','49.99','EUR'),('pound','17.5','GBP'),('cad','30.5','CAD')]:
            p.locator('#'+tag+' button span').click()
            expect_amount(p,amount)
            assert p.locator('#clplens-panel .clplens-inputrow select').first.input_value()==currency
    finally:p.close()

def scenario_unlabeled_symbol(browser,mobile):
    html="""<main><article><button id="price"><span>3 Month Plan</span><strong>$165</strong></button></article></main>"""
    cfg={'allowedSites':[HOST]}
    p=setup(browser,html,mobile=mobile,width=390 if mobile else 1366,config=cfg)
    try:
        p.locator('#price span').click()
        p.wait_for_selector('#moncevia-dollar-dialog',timeout=3500)
        assert p.locator(AMOUNT).first.input_value()!='165'
        p.locator('#moncevia-dollar-dialog select').select_option('CAD')
        p.get_by_role('button',name='Confirm currency').click()
        expect_amount(p,165)
        assert p.locator('#clplens-panel .clplens-inputrow select').first.input_value()=='CAD'
    finally:p.close()

def scenario_untouched_checkout(browser,mobile):
    html="""<main><p class="product-price">$10.00</p>
    <a id="purchase" href="/checkout" onclick="window.purchaseClicks=(window.purchaseClicks||0)+1; event.preventDefault()">Purchase now</a>
    <button id="faq" onclick="window.faqClicks=(window.faqClicks||0)+1">FAQ</button></main>"""
    p=setup(browser,html,mobile=mobile,width=390 if mobile else 1366)
    try:
        set_manual(p,50)
        p.locator('#purchase').click()
        p.locator('#faq').click()
        assert p.evaluate('window.purchaseClicks')==1
        assert p.evaluate('window.faqClicks')==1
        expect_amount(p,50)
    finally:p.close()


def scenario_headline_price_without_css_hook(browser,mobile):
    """Hero price near h1, separated from variant rows."""
    html="""<main><div class="detail"><h1>Sample Product</h1><p>In stock</p>
    <div id="price-display">$10.00</div><h2>Variant</h2>
    <div class="variant-list">
      <div role="option" class="variant-card" id="choice25" onclick="updatePrice(25)">3 Day License</div>
      <div role="option" class="variant-card" id="choice55" onclick="updatePrice(55)">2 Week License</div>
    </div></div>
    <script>function updatePrice(n){setTimeout(()=>document.querySelector('#price-display').textContent='
  scenario_nested_card,scenario_text_only_variant,scenario_async_race,
  scenario_shopify_select,scenario_quantity,scenario_discounts,
  scenario_multiple_products,scenario_currency_and_format,
  scenario_unlabeled_symbol,scenario_untouched_checkout,
  scenario_headline_price_without_css_hook,scenario_catalog_checkbox_safety
]

def run():
    failures=[]
    with sync_playwright() as playwright:
        kind=os.environ.get('MONCEVIA_TEST_BROWSER','chromium').lower()
        if kind not in ('chromium','firefox','webkit'):
            raise ValueError('Unknown browser '+kind)
        options={'headless':True}
        if kind=='chromium': options.update(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
        browser=getattr(playwright,kind).launch(**options)
        for mobile in [False,True]:
            for scenario in SCENARIOS:
                label=('Mobile' if mobile else 'Desktop')+'/'+scenario.__name__
                try:
                    scenario(browser,mobile)
                    print('PASS',label,flush=True)
                except Exception as exc:
                    failures.append((label,str(exc)))
                    print('FAIL',label,repr(exc),flush=True)
        browser.close()
    if failures:
        print('FAILURES:',json.dumps(failures,indent=2))
        raise AssertionError(str(len(failures))+' dynamic-price scenarios failed')
    print('PASS ALL',len(SCENARIOS)*2,'dynamic e-commerce scenarios')

if __name__=='__main__':
    run()
+n+'.00',100);}</script></main>"""
    p=setup(browser,html,mobile=mobile,width=390 if mobile else 1366)
    try:
        set_manual(p,24.99)
        p.locator('#choice25').click()
        expect_amount(p,25)
        p.locator('#choice55').click()
        expect_amount(p,55)
    finally:p.close()

def scenario_catalog_checkbox_safety(browser,mobile):
    """An unrelated filter does not reset a manually entered amount."""
    html="""<main><h1>Browse items</h1>
    <label><input type="checkbox" id="onsale"/>On sale only</label>
    <section><article><div class="product-price">$19</div></article>
    <article><div class="product-price">$35</div></article></section></main>"""
    p=setup(browser,html,mobile=mobile,width=390 if mobile else 1366)
    try:
        set_manual(p,77)
        p.locator('#onsale').check()
        p.wait_for_timeout(450)
        expect_amount(p,77)
    finally:p.close()

SCENARIOS=[
  scenario_nested_card,scenario_text_only_variant,scenario_async_race,
  scenario_shopify_select,scenario_quantity,scenario_discounts,
  scenario_multiple_products,scenario_currency_and_format,
  scenario_unlabeled_symbol,scenario_untouched_checkout
]

def run():
    failures=[]
    with sync_playwright() as playwright:
        kind=os.environ.get('MONCEVIA_TEST_BROWSER','chromium').lower()
        if kind not in ('chromium','firefox','webkit'):
            raise ValueError('Unknown browser '+kind)
        options={'headless':True}
        if kind=='chromium': options.update(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
        browser=getattr(playwright,kind).launch(**options)
        for mobile in [False,True]:
            for scenario in SCENARIOS:
                label=('Mobile' if mobile else 'Desktop')+'/'+scenario.__name__
                try:
                    scenario(browser,mobile)
                    print('PASS',label,flush=True)
                except Exception as exc:
                    failures.append((label,str(exc)))
                    print('FAIL',label,repr(exc),flush=True)
        browser.close()
    if failures:
        print('FAILURES:',json.dumps(failures,indent=2))
        raise AssertionError(str(len(failures))+' dynamic-price scenarios failed')
    print('PASS ALL',len(SCENARIOS)*2,'dynamic e-commerce scenarios')

if __name__=='__main__':
    run()
