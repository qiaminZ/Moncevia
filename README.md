# Moncevia

**Currency & Crypto Companion — Safari userscript**

Moncevia helps estimate the Chilean peso (CLP) equivalent of displayed prices and compare selected cryptocurrency payment paths. It is a **read-only, informational** browser userscript; it neither trades nor transfers funds and is **not affiliated with Binance**.

**Version:** 3.4.0 · [Install script](https://raw.githubusercontent.com/qiaminZ/Moncevia/main/moncevia.user.js)

## Compartir e instalar / Share & install

**Enlace público para compartir:** https://github.com/qiaminZ/Moncevia

**Script instalable:** https://raw.githubusercontent.com/qiaminZ/Moncevia/main/moncevia.user.js

En iPhone: instala Userscripts para Safari, guarda el archivo `.user.js` desde el enlace anterior en la carpeta configurada en Userscripts y recarga el sitio. No es necesario descargar el ZIP de ChatGPT. El enlace a la rama `main` siempre sirve la versión publicada más reciente; el gestor podrá consultar los campos `@updateURL` y `@downloadURL`, según sus capacidades. Para ayuda consulta el apartado de instalación.

**Read this before paying:** Moncevia only estimates values. Always confirm the actual crypto amount, network and withdrawal fee at the exchange. No transfer is executed by this script.

## Interfaz móvil v3.3.0 / Mobile interface

Moncevia ahora funciona como una miniaplicación de **cinco secciones**, en lugar de una página larga:

1. **Convertir / Convert:** introduce un importe o selecciona el precio de un producto y consulta CLP, BTC, ETH, LTC, USD y EUR. Los resultados principales aparecen primero.
2. **Pagar / Pay:** simula el importe necesario para un pago con BTC, ETH o LTC. Expande solo la moneda que quieras consultar. Si tienes la cantidad exacta exigida por el comercio, activa su casilla e introdúcela.
3. **Comparar / Compare:** revisa la estimación de Prex, Santander y Binance en una vista independiente. No presenta como ganadora una opción sin costos verificados.
4. **Historial / History:** guarda, revisa, reutiliza o exporta tus consultas localmente.
5. **Ajustes / Settings:** organiza permisos, tasas manuales, tarjetas, Binance, redes y ayuda mediante bloques desplegables.

En la cabecera, **Tasas y fuentes** expone las cotizaciones detalladas solo cuando las solicitas. La navegación admite teclado y tiene etiquetas accesibles; en iPhone puedes cambiar de sección tocando las cinco pestañas. Las advertencias se han resumido sin suprimir las limitaciones financieras.

La v3.3.0 es una **refactorización de UI/UX**: no añade permisos nuevos, no ejecuta pagos ni reemplaza las comprobaciones de Binance. Se ha probado con Chromium en pantallas de 320, 375 y 390 px y en orientación horizontal, además de regresiones del motor. Falta comprobación en Safari iOS real para la versión 3.3.0.

**English:** Five focused tabs: Convert, Pay, Compare, History and Settings. Payment details and settings are collapsible; rates and data sources are available on demand. Financial estimates and all existing safety limits remain unchanged.

## Qué hace / Features

- Reconoce precios con moneda explícita (EUR, USD, GBP, CAD, AUD, JPY, KRW, BRL, CNY, BTC, ETH, LTC), con opción de activar `$` sin prefijo **por dominio**.
- Conversión estimada a CLP y criptomonedas; calculadora con ingreso manual, selección de importes tocados y sincronización con planes y cantidades en páginas compatibles, incluido RIFT.
- Datos de FX de [ExchangeRate-API](https://www.exchangerate-api.com/), cripto de **Binance Spot** `bookTicker` para BTC/ETH/LTC expresados en USDT, y **USDT/USD de CoinGecko** por separado. Si falla alguna fuente, puede usar referencias cripto en USD de CoinGecko/Coinbase; no presenta esos precios como compra Spot ejecutable.
- Simula el costo aproximado en USDT incluyendo comisión de negociación, retiro por red y colchón configurados manualmente; compara alternativas solo si el usuario las marcó como verificadas.
- Historial local de hasta 30 consultas con **exportación CSV voluntaria**, modo compacto, revocación de autorización y acceso por sitio. **No se guardan dominios en nuevas consultas salvo que lo actives**.

## Instalación en iPhone / iOS Safari

1. Instala **Userscripts** para Safari desde App Store y activa la extensión en los ajustes de Safari.
2. Descarga [moncevia.user.js](https://raw.githubusercontent.com/qiaminZ/Moncevia/main/moncevia.user.js) o usa **Compartir → Guardar en Archivos**.
3. Copia el archivo a la carpeta que seleccionaste en Userscripts. Recarga la página en Safari.
4. En `shop.riftbot.org` se habilita por defecto. En otros sitios HTTPS compatibles aparece **«Moncevia · activar aquí»**: tócala para autorizar ese dominio.
5. **Desactiva** instalaciones antiguas de CLP Lens o Moncevia antes de activar esta versión, para no duplicar botones ni conversiones. Revisa si tus preferencias se conservaron: los cambios de nombre pueden crear identidades nuevas según el gestor.

Moncevia ejecuta un control inicial en sitios HTTPS para ofrecer la autorización, pero no realiza escaneo de precios ni peticiones de cotización en dominios no aprobados. No se inicia en páginas de pagos, banca, autenticación, dominios `.cl` ni otros sitios sensibles contemplados por las exclusiones. Es una defensa de mejor esfuerzo, **no una garantía universal**.

## Controles de seguridad y privacidad

- Cambiar el valor de una comisión Spot, de retiro, costo de fondeo o margen bancario **revoca el estado «verificado»** hasta que lo marques nuevamente. Cambiar la red de retiro hace lo mismo con su comisión.
- «Revocar acceso a este sitio» está en **Ajustes**: elimina su autorización y recarga la página. Cuando desactivas un dominio no se consultan tasas desde ese sitio.
- El historial se guarda solo al pulsar «Guardar consulta». En Historial puedes descargarlo como CSV (archivo local), o borrarlo. Revisa su contenido antes de compartirlo; un historial guardado con la opción correspondiente puede contener dominios de tiendas.
- Las cotizaciones FX deben contener fecha de actualización del proveedor no mayor a siete días. Las cotizaciones pueden estar desactualizadas entre consultas; se indica su fuente y antigüedad.

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
python tests/test_ui_mobile.py
```

Las pruebas usan respuestas de mercado **simuladas** y una página local, y comprueban conversión USDT/USD, selección de planes, cantidad, retiro LTC, privacidad básica y exclusión de checkout. **No sustituyen pruebas físicas en Safari y Userscripts iOS**.

## Privacidad, seguridad y licencias

Lee [PRIVACY.md](PRIVACY.md), [SECURITY.md](SECURITY.md) y [CHANGELOG.md](CHANGELOG.md). Los ajustes e historial se guardan en el almacenamiento de Userscripts; las solicitudes de cotización salen hacia proveedores externos, que pueden ver la IP de la petición. No se envía historial a un servidor de Moncevia.

**License:** Public source code, with all rights reserved until the copyright owner selects an explicit license. Public availability on GitHub does not authorize redistribution, relicensing or derivative products by default.

---

**English quick start:** Install Userscripts on iOS Safari, save `moncevia.user.js` to your Userscripts folder, reload the page and explicitly enable each new supported website. Market prices and estimated payment costs are informational, not execution guarantees. Withdrawal fees and payment networks must be checked in your own exchange before sending funds.

## Idioma / Language (v3.4.0)

- **Auto** usa el idioma preferido del navegador: español para variantes `es-*`, inglés para los demás idiomas.
- El control **ES / EN** del encabezado alterna el idioma inmediatamente, sin recargar ni modificar conversiones.
- En **Ajustes → General y sitio actual → Idioma / Language** también puedes elegir Auto, Español o English. La preferencia se guarda en Userscripts junto a los ajustes anteriores.
- Los importes y fechas se formatean según el idioma de la interfaz (`es-CL` / `en-US`), pero los precios originales de la web no se modifican.
- Los nombres propios, códigos de moneda, redes y texto externo de la tienda siguen su idioma original.

**English:** Select `Auto`, `Español`, or `English` in Settings, or use the header ES/EN toggle. The language is saved locally and does not change market-rate calculations.

## Estado de pruebas / Validation

Browser regressions now run in Spanish and English. Spanish conversion/payment tests, English navigation and live switching, and responsive viewports are automated in Chromium; manual iOS Safari / Userscripts testing of v3.4.0 remains recommended before the next major expansion.
