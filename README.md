# Moncevia

**Currency & Crypto Companion — Safari userscript**

Moncevia helps estimate the Chilean peso (CLP) equivalent of displayed prices and compare selected cryptocurrency payment paths. It is a **read-only, informational** browser userscript; it neither trades nor transfers funds and is **not affiliated with Binance**.

**Version:** 3.1.0 · [Install script](https://raw.githubusercontent.com/qiaminZ/Moncevia/main/moncevia.user.js)

## Qué hace / Features

- Reconoce precios con moneda explícita (EUR, USD, GBP, CAD, AUD, JPY, KRW, BRL, CNY, BTC, ETH, LTC), con opción de activar `$` sin prefijo **por dominio**.
- Conversión estimada a CLP y criptomonedas; calculadora con ingreso manual, selección de importes tocados y sincronización con planes y cantidades en páginas compatibles, incluido RIFT.
- Datos de FX de [ExchangeRate-API](https://www.exchangerate-api.com/), cripto de **Binance Spot** `bookTicker` para BTC/ETH/LTC expresados en USDT, y **USDT/USD de CoinGecko** por separado. Si falla alguna fuente, puede usar referencias cripto en USD de CoinGecko/Coinbase; no presenta esos precios como compra Spot ejecutable.
- Simula el costo aproximado en USDT incluyendo comisión de negociación, retiro por red y colchón configurados manualmente; compara alternativas solo si el usuario las marcó como verificadas.
- Historial local de hasta 30 consultas, modo compacto y autorización por sitio. **No se guardan dominios en nuevas consultas salvo que lo actives**.

## Instalación en iPhone / iOS Safari

1. Instala **Userscripts** para Safari desde App Store y activa la extensión en los ajustes de Safari.
2. Descarga [moncevia.user.js](https://raw.githubusercontent.com/qiaminZ/Moncevia/main/moncevia.user.js) o usa **Compartir → Guardar en Archivos**.
3. Copia el archivo a la carpeta que seleccionaste en Userscripts. Recarga la página en Safari.
4. En `shop.riftbot.org` se habilita por defecto. En otros sitios HTTPS compatibles aparece **«Moncevia · activar aquí»**: tócala para autorizar ese dominio.
5. **Desactiva** instalaciones antiguas de CLP Lens o Moncevia antes de activar esta versión, para no duplicar botones ni conversiones. Revisa si tus preferencias se conservaron: los cambios de nombre pueden crear identidades nuevas según el gestor.

Moncevia ejecuta un control inicial en sitios HTTPS para ofrecer la autorización, pero no realiza escaneo de precios ni peticiones de cotización en dominios no aprobados. No se inicia en páginas de pagos, banca, autenticación, dominios `.cl` ni otros sitios sensibles contemplados por las exclusiones. Es una defensa de mejor esfuerzo, **no una garantía universal**.

## Cómo estimar un pago cripto / Crypto payments

1. Comprueba el **importe exacto que exige el comercio**, la **moneda** y la **red correcta**.
2. Activa «Usar importe exacto solicitado en cripto» e introduce la cantidad (hasta 8 decimales en este simulador).
3. En Binance, verifica comisión y mínimo de retiro de esa **red**, y tus comisiones Spot. Transcribe las cifras en **Ajustes** y márcalas como verificadas solo después de confirmarlas.
4. Moncevia aproxima la cantidad total a disponer y el coste Spot en USDT; las tasas de Binance, CoinGecko y de cambio de divisas cambian. Revisa el importe real a recibir **en la pantalla final de Binance** antes de transferir.

**Advertencia:** no se obtienen tarifas privadas automáticamente, no se garantiza liquidez en la mejor cotización (*ask*), el coste P2P o el pago final. Los porcentajes manuales no son tarifas oficiales. Las criptomonedas pueden subir o bajar mientras preparas una compra. Nunca introduzcas claves API en el script.

## Desarrollo / Development

```bash
python -m pip install -r requirements-dev.txt
python -m playwright install chromium
node --check moncevia.user.js
python tests/test_browser.py
```

Las pruebas usan respuestas de mercado **simuladas** y una página local, y comprueban conversión USDT/USD, selección de planes, cantidad, retiro LTC, privacidad básica y exclusión de checkout. **No sustituyen pruebas físicas en Safari y Userscripts iOS**.

## Privacidad, seguridad y licencias

Lee [PRIVACY.md](PRIVACY.md), [SECURITY.md](SECURITY.md) y [CHANGELOG.md](CHANGELOG.md). Los ajustes e historial se guardan en el almacenamiento de Userscripts; las solicitudes de cotización salen hacia proveedores externos, que pueden ver la IP de la petición. No se envía historial a un servidor de Moncevia.

**License:** Public source code, with all rights reserved until the copyright owner selects an explicit license. Public availability on GitHub does not authorize redistribution, relicensing or derivative products by default.

---

**English quick start:** Install Userscripts on iOS Safari, save `moncevia.user.js` to your Userscripts folder, reload the page and explicitly enable each new supported website. Market prices and estimated payment costs are informational, not execution guarantees. Withdrawal fees and payment networks must be checked in your own exchange before sending funds.