import fs from 'node:fs';
import vm from 'node:vm';
import { strict as assert } from 'node:assert';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function testBackground(folder) {
  const called = [];
  let handler;
  const chrome = {runtime:{onMessage:{addListener(fn){handler=fn;}}}};
  const fakeFetch = async(url,opts)=>{
    called.push({url,opts});
    return {ok:true,status:200,headers:{get(){return '13';}},text:async()=>'{"price":123}'};
  };
  const ctx = {chrome, URL, Set, AbortController, setTimeout, clearTimeout, fetch:fakeFetch};
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(folder,'background.js'),'utf8'),ctx);
  assert.equal(typeof handler,'function');
  const goodSender={tab:{id:12},url:'https://example.com/product'};
  function send(url,sender=goodSender){
    return new Promise(resolve=>handler({kind:'moncevia:rate',url},sender,resolve));
  }
  const good = [
    'https://data-api.binance.vision/api/v3/ticker/bookTicker?symbol=BTCUSDT',
    'https://api.binance.com/api/v3/ticker/bookTicker?symbol=ETHUSDT',
    'https://open.er-api.com/v6/latest/USD',
    'https://api.coinbase.com/v2/prices/LTC-USD/spot',
    'https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=usd&include_last_updated_at=true',
    'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin%2Cethereum%2Clitecoin&vs_currencies=usd&include_last_updated_at=true'
  ];
  for(const url of good){const res=await send(url);assert.equal(res.ok,true,url)}
  assert.equal(called.length,good.length);
  for (const x of called) { assert.equal(x.opts.credentials,'omit'); assert.equal(x.opts.redirect,'error'); }
  const denied=[
    'https://api.binance.com/api/v3/account',
    'https://api.binance.com/api/v3/ticker/bookTicker?symbol=BNBUSDT',
    'https://api.binance.com/api/v3/ticker/bookTicker?symbol=BTCUSDT&x=1',
    'http://open.er-api.com/v6/latest/USD',
    'https://api.coinbase.com/v2/accounts',
    'https://example.com/secret',
    'https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=usd&include_last_updated_at=true&api_key=abc'
  ];
  for(const url of denied){const res=await send(url);assert.equal(res.ok,false,url)}
  for (const sender of [{tab:{id:2},url:'https://mybank.cl/'},{tab:{id:2},url:'https://www.bci.cl/'},{tab:{id:2},url:'https://flow.cl/'},{tab:{id:2},url:'https://example.com/checkout'},{tab:{id:2},url:'https://shop.example.cl/pago'},{tab:{id:2},url:'https://shop.example.cl/iniciar-sesion'},{}]) {
    const res=await send(good[0],sender);assert.equal(res.ok,false,'sender bypass');
  }
  assert.equal(called.length,good.length,'denied request must not use fetch');
  const chileanShop=await send(good[0],{tab:{id:3},url:'https://shop.example.cl/producto'});
  assert.equal(chileanShop.ok,true,'ordinary Chilean shop');
}

async function testBridge(folder, firefox) {
  const memory={};
  const chrome={runtime:{lastError:null,sendMessage(payload,cb){cb({ok:true,status:200,body:'{"ok":true}'})}},storage:{local:{
    get(key,cb){cb(Object.prototype.hasOwnProperty.call(memory,key)?{[key]:memory[key]}:{})},set(obj,cb){Object.assign(memory,obj);cb()}
  }}};
  const sandbox={chrome};
  if(firefox){
    sandbox.browser={runtime:{sendMessage:async()=>({ok:true,status:200,body:'{"ok":true}'})},storage:{local:{
      get:async(key)=>(Object.prototype.hasOwnProperty.call(memory,key)?{[key]:memory[key]}:{}),set:async(obj)=>{Object.assign(memory,obj);}
    }}};
  }
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(folder,'bridge.js'),'utf8'),sandbox);
  const GM=sandbox.GM;
  assert.ok(GM);
  assert.equal(await GM.getValue('absent',37),37);
  await GM.setValue('rate',0.9989);
  assert.equal(await GM.getValue('rate',1),0.9989);
  assert.equal(memory['moncevia:rate'],0.9989);
  const result=await GM.xmlHttpRequest({method:'GET',url:'https://open.er-api.com/v6/latest/USD'});
  assert.equal(result.status,200);
  await assert.rejects(()=>GM.xmlHttpRequest({method:'POST',url:'x'}));
}
(async()=>{
  for (const kind of ['chromium','firefox']) {
    const folder=path.join(ROOT,'extension',kind);
    await testBackground(folder);
    await testBridge(folder,false);
    await testBridge(folder,true);
    console.log('PASS',kind,'broker allowlist, rejected URLs, storage, Chrome/Firefox APIs');
  }
})().catch(error=>{console.error(error);process.exitCode=1});
