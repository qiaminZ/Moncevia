"""Build unpacked native extension directories and local ZIP archives from the shared engine."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import json
import shutil

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'moncevia.user.js'
OUT = ROOT / 'dist'

def build():
    OUT.mkdir(exist_ok=True)
    for browser in ('chromium', 'firefox'):
        src = ROOT / 'extension' / browser
        target = OUT / f'moncevia-{browser}'
        target.mkdir(exist_ok=True)
        assert (src / 'engine.js').read_bytes() == SOURCE.read_bytes(), 'Engine drift from userscript'
        files = ('manifest.json','engine.js','bridge.js','background.js','popup.html')
        manifest = json.loads((src / 'manifest.json').read_text())
        assert manifest['manifest_version'] == 3
        for name in files: shutil.copyfile(src / name, target / name)
        with ZipFile(OUT / f'moncevia-{browser}-0.1.1-beta.zip','w',ZIP_DEFLATED) as archive:
            for name in files: archive.write(target / name, name)
        print('Built', browser, 'extension package')

if __name__ == '__main__': build()
