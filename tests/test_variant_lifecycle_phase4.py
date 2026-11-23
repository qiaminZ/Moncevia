"""Phase 4: late asynchronous storefront updates never overwrite a manual price.

Runs on Chromium, Firefox and WebKit, on desktop and emulated mobile screens.
The storefront fixture discards obsolete responses before painting its price.
"""
import os
from playwright.sync_api import sync_playwright
from test_shop_scenarios import setup, expect_amount, AMOUNT

HTML = """<main><h1>Product</h1>
  <strong data-testid="product-price">$10.00</strong>
  <section class="variants">
    <button data-variant="25">3 Day License</button>
    <button data-variant="55">2 Week License</button>
  </section>
  <script>
    let generation = 0;
    document.querySelectorAll('[data-variant]').forEach(button => {
      button.addEventListener('click', () => {
        const price = button.dataset.variant;
        const current = ++generation;
        const delay = price === '25' ? 300 : 90;
        setTimeout(() => {
          if (current !== generation) return;
          document.querySelector('[data-testid=product-price]').textContent = '$' + price + '.00';
        }, delay);
      });
    });
  </script></main>"""

def run():
    engine = os.environ.get('MONCEVIA_TEST_BROWSER', 'chromium').lower()
    assert engine in ('chromium', 'firefox', 'webkit')
    with sync_playwright() as playwright:
        kwargs = {'headless': True}
        if engine == 'chromium':
            kwargs.update(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
        browser = getattr(playwright, engine).launch(**kwargs)
        for mobile in (False, True):
            page = setup(browser, HTML, width=390 if mobile else 1366, mobile=mobile)
            try:
                page.locator('[data-variant="25"]').click()
                page.locator('[data-variant="55"]').click()
                page.wait_for_function("document.querySelector('[data-testid=product-price]').textContent === '$55.00'")
                expect_amount(page, 55)
                page.locator('#clplens-fab').click()
                page.locator(AMOUNT).first.fill('88')
                page.locator('#clplens-fab').click()
                page.wait_for_timeout(3100)
                expect_amount(page, 88, timeout=200)
                # A fresh selection must restore automatic synchronization.
                page.locator('[data-variant="55"]').click()
                expect_amount(page, 55)
            finally:
                page.close()
        browser.close()
    print('PASS', engine, 'manual override and fast variants on 2 viewports', flush=True)

if __name__ == '__main__':
    run()
