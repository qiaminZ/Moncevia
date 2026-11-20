from playwright.sync_api import sync_playwright
from pathlib import Path
from time import time
import json
ROOT=Path(__file__).resolve().parents[1]
S=str(ROOT/'moncevia.user.js')
HTML=(ROOT/'tests'/'rift-fixture.html').read_text()
fx={'result':'success','base_code':'USD','time_last_update_unix':int(time()),'rates':{'USD':1,'EUR':0.90,'CLP':1000,'GBP':0.75}}
coins={'BTC':{'ask':'79010.00','bid':'78990.00'},'ETH':{'ask':'2301.00','bid':'2299.00'},'LTC':{'ask':'60.20','bid':'60.00'}}
coingecko={k:{'usd':usd,'last_updated_at':int(time())} for k,usd in [('bitcoin',79000),('ethereum',2300),('litecoin',60)]}
coingecko['tether']={'usd':1.002, 'last_updated_at':int(time())}
INIT='''window._persist={};window._requests=[];
window.GM={getValue:async (k,d)=>window._persist[k]??d,
setValue:async(k,v)=>{window._persist[k]=v;return true},
xmlHttpRequest: async({url})=>{window._requests.push(url);let data=null;
 if(url.includes('open.er-api')) data=__FX__;
 else if(url.includes('/ticker/bookTicker?symbol=')) {let coin=url.match(/symbol=(\\w+)USDT/)[1];data={symbol:coin+'USDT',askPrice:__COINS__[coin].ask,bidPrice:__COINS__[coin].bid};}
 else if(url.includes('coingecko') && url.includes('tether')) data={tether:__CG__.tether};
 else if(url.includes('coingecko')) data=__CG__;
 else throw Error('Unexpected API '+url);
 return {status:200,responseText:JSON.stringify(data)};
}}
'''.replace('__FX__',json.dumps(fx)).replace('__COINS__',json.dumps(coins)).replace('__CG__',json.dumps(coingecko))

def test():
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True,locale='es-CL')
  errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(HTML)
  page.evaluate(INIT)
  page.add_script_tag(content=Path(S).read_text().replace('const HOST = location.hostname.toLowerCase();',"const HOST = 'shop.riftbot.org';"))
  page.wait_for_selector('#clplens-fab')
  page.wait_for_function("window._persist['clplens_crypto_rates_v2']?.usdtUsd>0")
  c=page.evaluate("window._persist.clplens_crypto_rates_v2")
  assert c['source'].startswith('Binance') and c['usdtUsd']==1.002,c
  assert c['usd']['LTC']>60.1, c
  page.locator('#clplens-fab').click()
  a=page.locator('#clplens-panel .clplens-inputrow input').first
  assert a.input_value()=='24.99'
  assert page.get_by_role('tab',name='Convertir').get_attribute('aria-selected')=='true'
  assert page.get_by_role('tab',name='Pagar').count()==1
  assert page.get_by_role('tab',name='Comparar').count()==1
  assert page.get_by_role('tab',name='Historial').count()==1
  assert page.get_by_role('tab',name='Ajustes').count()==1
  page.get_by_text('Tasas y fuentes').click()
  assert '1 USDT' in page.locator('#clplens-panel').inner_text()
  page.get_by_text('Tasas y fuentes').click()
  page.locator('#clplens-fab').click()
  page.locator('#opt7').click()
  page.wait_for_timeout(300)
  assert a.input_value()=='49.99',a.input_value()
  page.locator('#plus').click();page.wait_for_timeout(550)
  assert a.input_value()=='99.98',a.input_value()
  page.locator('#clplens-fab').click()
  page.get_by_role('button',name='Vista compacta').click()
  assert page.locator('#clplens-compact').is_visible()
  page.locator('#clplens-fab').click()
  page.get_by_role('button',name='Guardar',exact=True).click()
  hist=page.evaluate('window._persist.clplens_history_v3')
  assert hist and hist[0]['site']=='no guardado', hist
  page.get_by_role('tab',name='Historial').click()
  assert page.get_by_role('button',name='Reutilizar').count()==1
  with page.expect_download() as downloaded:
   page.get_by_role('button',name='Exportar historial CSV').click()
  csvfile=downloaded.value.path()
  assert 'no guardado' in Path(csvfile).read_text(encoding='utf-8-sig')
  page.get_by_role('tab',name='Convertir').click()
  page.get_by_role('tab',name='Pagar').click()
  page.get_by_text('Usar importe exacto solicitado en cripto').click()
  page.locator('#clplens-panel .clplens-inputrow input').nth(1).fill('0.53340448')
  page.get_by_role('tab',name='Ajustes').click()
  page.get_by_text('Binance y redes de retiro').click()
  page.get_by_text('Comisión de retiro LTC verificada').click()
  page.get_by_text('Comisión Spot verificada',exact=True).click()
  page.get_by_text('Costo de fondeo USDT verificado').click()
  fee=page.get_by_text('Retiro LTC (LTC)').locator('..').locator('input')
  fee.fill('0.001');fee.dispatch_event('change')
  spot=page.get_by_text('Comisión de compra Spot (%)').locator('..').locator('input')
  spot.fill('0.1');spot.dispatch_event('change')
  # Changing a previously verified commission must revoke its verified status.
  assert not page.get_by_text('Comisión de retiro LTC verificada').locator('..').locator('input').is_checked()
  assert not page.get_by_text('Comisión Spot verificada',exact=True).locator('..').locator('input').is_checked()
  page.get_by_text('Comisión de retiro LTC verificada').click()
  page.get_by_text('Comisión Spot verificada',exact=True).click()
  page.get_by_role('tab',name='Pagar').click()
  page.locator('details[data-mv-coin="LTC"] summary').click()
  payment=page.locator('details[data-mv-coin="LTC"]').inner_text()
  assert '0.53493942' in payment,payment
  assert 'USDT' in payment,payment
  page.get_by_role('tab',name='Ajustes').click()
  page.get_by_text('Red de retiro LTC').locator('..').locator('input').fill('Other-Network')
  page.get_by_text('Red de retiro LTC').locator('..').locator('input').dispatch_event('change')
  assert not page.get_by_text('Comisión de retiro LTC verificada').locator('..').locator('input').is_checked()
  page.get_by_role('tab',name='Pagar').click()
  assert 'Faltan datos de costos' in page.locator('details[data-mv-coin="LTC"]').inner_text()
  page.get_by_role('tab',name='Convertir').click()
  page.get_by_role('button',name='Seleccionar en web').click()
  page.locator('#opt14').click()
  assert a.input_value()=='74.99'
  assert not errors,errors
  # Views are independent: payment setup is not visible on Convertir.
  page.get_by_role('tab',name='Comparar').click()
  assert page.get_by_text('Comparar métodos de pago').is_visible()
  assert not page.get_by_text('Pago con criptomonedas').is_visible()
  page.get_by_role('tab',name='Ajustes').click()
  group=page.locator('details.mv-settings-group').filter(has_text='Binance y redes de retiro')
  if group.get_attribute('open') is not None: page.get_by_text('Binance y redes de retiro').click()
  assert not page.get_by_text('Retiro BTC (BTC)').is_visible()
  page.get_by_text('Binance y redes de retiro').click()
  assert page.get_by_text('Retiro BTC (BTC)').is_visible()
  # Opt-in site is silent before authorization: zero API requests.
  other=browser.new_page()
  other.set_content('<h1>Shop</h1><p>€19.99</p>')
  other.evaluate(INIT);other.add_script_tag(content=Path(S).read_text().replace('const HOST = location.hostname.toLowerCase();',"const HOST = 'example.com';"))
  other.wait_for_selector('#moncevia-optin')
  assert other.evaluate('window._requests.length')==0
  assert other.locator('#clplens-widget').count()==0
  other.locator('#moncevia-optin').click()
  other.wait_for_selector('#clplens-widget')
  other.wait_for_function("window._persist['clplens_crypto_rates_v2']?.usdtUsd>0")
  assert 'example.com' in other.evaluate("window._persist['clplens_v1'].allowedSites")
  # Checkout never runs.
  checkout=browser.new_page()
  checkout.set_content('<h1>Checkout €19.99</h1>')
  checkout.evaluate(INIT);checkout.add_script_tag(content=Path(S).read_text().replace('const HOST = location.hostname.toLowerCase();',"const HOST = 'shop.riftbot.org';").replace('location.pathname','"/checkout"'));checkout.wait_for_timeout(150)
  assert checkout.locator('#clplens-widget,#moncevia-optin').count()==0
  # Explicitly disabled websites make no rate requests, even when previously authorized.
  disabled=browser.new_page()
  disabled.set_content('<p>€12.00</p>')
  disabled.evaluate(INIT)
  disabled.evaluate("window._persist.clplens_v1={allowedSites:['shop.riftbot.org'],disabledSites:['shop.riftbot.org']}")
  disabled.add_script_tag(content=Path(S).read_text().replace('const HOST = location.hostname.toLowerCase();',"const HOST = 'shop.riftbot.org';"))
  disabled.wait_for_selector('#clplens-widget')
  disabled.wait_for_timeout(180)
  assert disabled.evaluate('window._requests.length')==0
  assert disabled.locator('.clplens-badge').count()==0
  print('PASS: synced plan+quantity, Binance Spot with USDT/USD 1.002, LTC safeguards, CSV export, opt-in privacy, disabled-site network silence, checkout exclusion, UI no JS errors')
  browser.close()

if __name__=='__main__': test()
