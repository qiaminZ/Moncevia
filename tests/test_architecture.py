"""Structural regression checks for the staged TypeScript/CSS migration."""
from pathlib import Path
import json

ROOT=Path(__file__).resolve().parents[1]


def test():
    script=(ROOT/'moncevia.user.js').read_bytes()
    assert script.startswith(b'// ==UserScript=='), 'Userscript metadata must be first'
    header=(ROOT/'src/meta/userscript.header.txt').read_text().rstrip()
    assert (ROOT/'moncevia.meta.js').read_text()==header+'\n', 'Safari update metadata mismatch'
    assert b'// @updateURL    https://raw.githubusercontent.com/qiaminZ/Moncevia/main/moncevia.meta.js' in script[:950]
    assert b'// @version      3.15.1' in script[:900]
    assert b'const HOST = location.hostname.toLowerCase()' in script
    assert b'.clplens-badge' in script, 'CSS must be embedded without external fetch'
    assert b'clplens-fab' in script
    for browser in ('chromium','firefox'):
        assert (ROOT/'extension'/browser/'engine.js').read_bytes()==script, 'Engine drift: '+browser
    assert (ROOT/'src/styles/moncevia.css').stat().st_size>10000
    assert (ROOT/'src/detector/scan-controller.ts').exists()
    assert (ROOT/'src/ui/tab-controller.ts').exists()
    assert (ROOT/'src/ui/fab-controller.ts').exists(), 'Typed FAB controller missing'
    assert (ROOT/'src/ui/panel-shell.ts').exists(), 'Typed panel shell missing'
    assert (ROOT/'src/ui/dom-factory.ts').exists(), 'Typed DOM primitives missing'
    assert b'createPanelShell' in script, 'Bundled typed panel shell missing'
    assert (ROOT/'src/platform/gm-bridge.ts').exists(), 'Typed GM transport module missing'
    assert (ROOT/'src/platform/persistence-controller.ts').exists(), 'Typed state persistence missing'
    assert (ROOT/'src/platform/page-lifecycle.ts').exists(), 'Typed page lifecycle missing'
    assert b'createPageLifecycle' in script, 'Bundled page lifecycle missing'
    assert b'createPersistenceController' in script, 'Bundled durable storage controller missing'
    assert b'createGMBridge' in script, 'Bundled GM transport module missing'
    assert b'createFabController' in script, 'Compiled FAB controller missing'
    assert (ROOT/'src/i18n/catalog.ts').exists(), 'Missing typed translation catalog'
    assert (ROOT/'src/i18n/localizer.ts').exists(), 'Missing reversible UI localizer'
    assert b'createUILocalizer' in script, 'Bundled localization controller missing'
    assert b'translateUI' in script, 'Bundled locale dictionary missing'
    assert (ROOT/'src/detector/variant-detector.ts').exists()
    assert (ROOT/'src/detector/selection-scheduler.ts').exists()
    assert b'createVariantDetector' in script, 'Compiled variant detector missing'
    assert b'createSelectionScheduler' in script, 'Compiled retry scheduler missing'
    assert b'createPriceScanner' in script, 'Bundled scanner missing'
    assert b'createTabController' in script, 'Bundled accessible navigation missing'
    for module in ('parse-amount.ts','conversion.ts','crypto-units.ts','fx-validation.ts','cache-validation.ts','settings-validation.ts','provider-validation.ts'):
        assert (ROOT/'src/core'/module).exists(), 'Missing typed core: '+module
    assert b'createConversionEngine' in script, 'Typed conversion engine must run in the installed artifact'
    assert b'normalizeSettings' in script, 'Typed settings validation must run in installed code'
    assert b'validateBinanceSnapshot' in script, 'Typed Binance payload validation must run in installed code'
    assert b'validateCoinbaseSnapshot' in script, 'Typed fallback validation must run in installed code'
    assert b'validateFXResponse' in script, 'Typed FX validation must run in the installed artifact'
    assert (ROOT/'src/core/parse-amount.ts').exists()
    assert (ROOT/'src/types/currency.ts').exists()
    assert (ROOT/'src/legacy/runtime.js').exists()
    assert (ROOT/'package-lock.json').exists(), 'Lockfile required for repeatable builds'
    p=json.loads((ROOT/'package.json').read_text())
    assert p['scripts'].get('typecheck') and p['scripts'].get('build:check')
    print('PASS: modular sources, embedded CSS, userscript metadata, lockfile, native parity')


if __name__=='__main__':test()
