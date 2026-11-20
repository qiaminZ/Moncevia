from pathlib import Path
import json
from zipfile import ZipFile
from hashlib import sha256

ROOT=Path(__file__).resolve().parents[1]
ENGINE=ROOT/'moncevia.user.js'

def main():
    for name in ('chromium','firefox'):
        folder=ROOT/'extension'/name
        manifest=json.loads((folder/'manifest.json').read_text())
        assert manifest['manifest_version']==3
        assert manifest['version']=='0.1.1'
        assert manifest['permissions']==['storage']
        assert manifest['content_scripts'][0]['matches']==['https://*/*']
        assert manifest['content_scripts'][0]['js']==['bridge.js','engine.js']
        assert all(url.startswith('https://') for url in manifest['host_permissions'])
        assert set(manifest['host_permissions'])=={
            'https://data-api.binance.vision/*', 'https://api.binance.com/*',
            'https://open.er-api.com/*','https://api.coingecko.com/*','https://api.coinbase.com/*'}
        if name=='chromium': assert manifest['background']=={'service_worker':'background.js'}
        else: assert manifest['background']=={'scripts':['background.js']}
        assert sha256((folder/'engine.js').read_bytes()).digest()==sha256(ENGINE.read_bytes()).digest()
        zipfile=ROOT/'dist'/f'moncevia-{name}-0.1.1-beta.zip'
        with ZipFile(zipfile) as z:
            assert set(z.namelist())=={'manifest.json','bridge.js','background.js','engine.js','popup.html'}
            assert z.testzip() is None
            assert z.read('engine.js')==ENGINE.read_bytes()
        print('PASS',name,'manifest, permission constraints, shared engine hash, ZIP')

if __name__=='__main__':main()
