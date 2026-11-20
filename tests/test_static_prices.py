from playwright.sync_api import sync_playwright
from pathlib import Path
from time import time
import json
ROOT=Path(__file__).resolve().parents[1]
SCRIPT=(ROOT/'moncevia.user.js').read_text()
NOW=int(time())
fx={'result':'success','base_code':'USD','time_last_update_unix':NOW,'rates':{'USD':1,'EUR':0.9,'CLP':1000,'GBP':0.75,'CAD':1.35,'AUD':1.5,'JPY':155,'KRW':1400,'BRL':5,'CNY':7}}
coin={'BTC':{'ask':'79010.00','bid':'78990.00'},'ETH':{'ask':'2301.00','bid':'2299.00'},'LTC':{'ask':'60.20','bid':'60.00'}}
cg={'tether':{'usd':1.002,'last_updated_at':NOW}}
init='''window._persist={};window._requests=[];
window.GM={getValue:async(k,d)=>window._persist[k]??d,
setValue:async(k,v)=>{window._persist[k]=v;return true},
xmlHttpRequest:async({url})=>{
window._requests.push(url); let data;
if(url.includes('open.er-api'))data=__FX__;
else if(url.includes('/ticker/bookTicker?symbol=')){const k=url.match(/symbol=(\\w+)USDT/)[1];data={symbol:k+'USDT',askPrice:__COIN__[k].ask,bidPrice:__COIN__[k].bid};}
else if(url.includes('coingecko')&&url.includes('tether'))data=__CG__;
else throw new Error('Unexpected URL '+url);
return {status:200,responseText:JSON.stringify(data)};
}};
'''.replace('__FX__',json.dumps(fx)).replace('__COIN__',json.dumps(coin)).replace('__CG__',json.dumps(cg))
html='''<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>
<section id="pricing"><h2>Choose Your License</h2>
<article id="plan10"><h3>1 Day</h3><div class="price">$10</div><a href="https://seller.example/checkout">Purchase</a></article>
<article id="plan20"><h3>3 Days</h3><div class="price">$20</div><a href="https://seller.example/checkout">Purchase</a></article>
<article id="plan35"><h3>1 Week</h3><div class="price">$35</div><a href="https://seller.example/checkout">Purchase</a></article>
<article id="plan70"><h3>1 Month</h3><div class="price">$70</div><a href="https://seller.example/checkout">Purchase</a></article>
<article id="plan165"><h3>3 Months</h3><div class="price">$165</div><a href="https://seller.example/checkout">Purchase</a></article>
<article id="plan260"><h3>Lifetime</h3><div class="price">$260</div><a href="https://seller.example/checkout">Purchase</a></article>
</section><p id="euro">€49.99</p><a href="/checkout">Checkout</a></body></html>'''

def page_with(browser, host, *, lang='es-CL', previous=None, body=html, path=None):
 p=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,locale=lang)
 errors=[];p.on('pageerror',lambda e: errors.append(str(e)))
 p.set_content(body);p.evaluate(init)
 if previous is not None: p.evaluate('window._persist.clplens_v1='+json.dumps(previous))
 script=SCRIPT.replace('const HOST = location.hostname.toLowerCase();',f"const HOST = '{host}';")
 if path: script=script.replace('location.pathname',f'"{path}"')
 p.add_script_tag(content=script)
 return p,errors

def test():
 with sync_playwright() as api:
  b=api.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  p,errors=page_with(b,'kumoribot.com',lang='en-US')
  p.wait_for_selector('#moncevia-optin')
  assert p.evaluate('window._requests.length') == 0
  p.locator('#moncevia-optin').click()
  p.wait_for_selector('#clplens-fab')
  p.wait_for_function("window._persist.clplens_crypto_rates_v2?.usdtUsd>0")
  assert p.locator('#plan20 .clplens-badge').count()==0, 'Bare $ must not silently become USD'
  p.locator('#plan20 .price').click()
  p.wait_for_selector('#moncevia-dollar-dialog')
  assert p.evaluate("window._persist.clplens_v1.dollarCurrencySites") in ({},None)
  p.locator('#moncevia-dollar-dialog select').select_option('USD')
  p.get_by_role('button',name='Confirm currency').click()
  assert p.evaluate("window._persist.clplens_v1.dollarCurrencySites['kumoribot.com']")=='USD'
  p.wait_for_function("document.querySelectorAll('#pricing .clplens-badge').length >= 6",timeout=10000)
  amount=p.locator('#clplens-panel .clplens-inputrow input').first
  assert amount.input_value()=='20',amount.input_value()
  p.get_by_role('tab',name='Convert').click()
  assert '20,000' in p.locator('.mv-hero').inner_text(),p.locator('.mv-hero').inner_text()
  assert p.locator('#plan70 .clplens-badge').count()==1
  p.get_by_role('button',name='Close',exact=True).click()
  p.locator('#plan70 .price').click()
  assert amount.input_value()=='70',amount.input_value()
  p.locator('#plan35 .price').click()
  assert amount.input_value()=='35',amount.input_value()
  # selected destination must stay independent of website currency
  p.locator('#clplens-fab').click()
  p.locator('#clplens-panel .mv-target-row select').select_option('ETH')
  p.get_by_role('button',name='Close',exact=True).click()
  p.locator('#plan165 .price').click()
  assert amount.input_value()=='165'
  assert p.locator('#clplens-panel .mv-target-row select').input_value()=='ETH'
  # switched currency is respected: no silent USD on a CLP website.
  q,err2=page_with(b,'shop.example.com',previous={'allowedSites':['shop.example.com'],'dollarCurrencySites':{'shop.example.com':'CLP'}},body=html)
  q.wait_for_selector('#clplens-fab')
  q.wait_for_function("document.querySelectorAll('#pricing .clplens-badge').length >= 6")
  q.locator('#plan165 .price').click()
  q.locator('#clplens-fab').click()
  assert q.locator('#clplens-panel .clplens-inputrow input').first.input_value()=='165'
  assert q.locator('#clplens-panel select').first.input_value()=='CLP'
  # Explicit EUR remains recognized and selected without symbol configuration.
  t,err3=page_with(b,'shop.eu',previous={'allowedSites':['shop.eu']},body=html)
  t.wait_for_selector('#clplens-fab');t.wait_for_function("document.querySelectorAll('#euro .clplens-badge').length > 0")
  t.locator('#euro').click()
  assert t.locator('#clplens-panel .clplens-inputrow input').first.input_value()=='49.99'
  assert t.locator('#clplens-panel select').first.input_value()=='EUR'
  # Explicit visual picker: selecting a static *card title* is enough.
  pick,err4=page_with(b,'static-shop.example',previous={'allowedSites':['static-shop.example']},body=html)
  pick.wait_for_selector('#clplens-fab')
  pick.locator('#clplens-fab').click()
  pick.get_by_role('button',name='Seleccionar en web').click()
  assert pick.locator('#clplens-panel').is_hidden()
  pick.locator('#plan35 h3').click()
  pick.wait_for_selector('#moncevia-dollar-dialog')
  pick.locator('#moncevia-dollar-dialog select').select_option('CAD')
  pick.get_by_role('button',name='Confirmar moneda').click()
  assert pick.locator('#clplens-panel .clplens-inputrow input').first.input_value()=='35'
  assert pick.locator('#clplens-panel select').first.input_value()=='CAD'
  assert pick.evaluate("window._persist.clplens_v1.dollarCurrencySites['static-shop.example']")=='CAD'
  # Existing legacy USD site preferences still work after migrating.
  legacy,err5=page_with(b,'legacy-shop.example',previous={'allowedSites':['legacy-shop.example'],'bareDollarSites':['legacy-shop.example']},body=html)
  legacy.wait_for_selector('#clplens-fab')
  legacy.wait_for_function("document.querySelectorAll('#pricing .clplens-badge').length >= 6")
  legacy.locator('#plan10 .price').click()
  assert legacy.locator('#clplens-panel select').first.input_value()=='USD'
  # Login/checkout pages remain excluded regardless of chosen currency.
  excluded,errs=page_with(b,'kumoribot.com',previous={'allowedSites':['kumoribot.com'],'dollarCurrencySites':{'kumoribot.com':'USD'}},path='/checkout')
  excluded.wait_for_timeout(200)
  assert excluded.locator('#clplens-widget,#moncevia-optin').count()==0
  assert not errors+err2+err3+err4+err5+errs,errors+err2+err3+err4+err5+errs
  for x in [p,q,t,pick,legacy,excluded]:x.close()
  b.close()
  print('PASS: six static $ price cards, USD site consent, CLP site consent, EUR, direct tap and badges, target preserved, sensitive exclusions')

if __name__=='__main__':test()
