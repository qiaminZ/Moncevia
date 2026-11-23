## Moncevia v3.10.0 — Fase 6: internacionalización modular y accesibilidad

El catálogo bilingüe ES/EN y las reglas de traducción dinámica se trasladaron a `src/i18n/catalog.ts`, mientras que la localización reversible de textos, etiquetas accesibles y mensajes se gestiona desde `src/i18n/localizer.ts`. La interfaz conserva los nombres de pestañas, comportamiento de conversión, ajustes y diseño. El usuario puede alternar español, inglés o idioma automático sin reinstalar Moncevia.

- En modo **Auto**, el navegador determina el idioma; la selección explícita tiene prioridad y se guarda localmente.
- Los textos y atributos ARIA propios de Moncevia se traducen sin modificar precios, botones ni contenido del comercio.
- El sistema recuerda el texto fuente para evitar traducciones acumuladas al alternar ES→EN→ES.
- Se añaden pruebas de traducción de advertencias financieras, mensajes variables y accesibilidad en seis combinaciones de navegador/tamaño.
- Las cotizaciones, permisos y fórmulas financieras no se modifican. La interfaz aún contiene componentes en JavaScript heredado, y las pruebas emuladas no sustituyen pruebas físicas con VoiceOver/Safari u Opera GX.

## Moncevia v3.9.0 — Fase 5: validación de configuración y proveedores

Los ajustes persistidos se normalizan en `src/core/settings-validation.ts`. Se conservan los dominios autorizados y preferencias válidas de versiones anteriores, y se rechazan entradas corruptas o configuraciones desconocidas sin ampliar permisos. El nuevo `src/core/provider-validation.ts` verifica las respuestas públicas de Binance, CoinGecko y Coinbase, incluidos los símbolos de criptoactivos, valores bid/ask, diferenciales y vigencia cuando el proveedor la entrega.

- Mantiene sin cambios los nombres de claves de almacenamiento, endpoints de cotización, fórmulas y restricciones de pago.
- La paridad USDT/USD de CoinGecko se valida separadamente de las cotizaciones Binance en USDT.
- Binance y Coinbase no proporcionan un timestamp verificable en los endpoints actuales: la hora de recepción local controla su vigencia; los valores son orientativos.
- Incluye pruebas unitarias de datos fraudulentos o incompletos, consentimientos de sitios y formatos antiguos.
- La UI y varias integraciones todavía usan JavaScript heredado. Las pruebas de navegadores emulados no certifican instalaciones físicas de Safari u Opera GX.

## Moncevia v3.8.0 — Fase 4: variantes tipadas y control de eventos

La detección avanzada de **planes, variantes, precios principales, resúmenes y símbolos monetarios ambiguos** ahora reside en `src/detector/variant-detector.ts` con tipado estricto y reglas conservadoras. El nuevo `src/detector/selection-scheduler.ts` cancela reintentos anteriores cuando el usuario cambia de opción y suspende las sincronizaciones pendientes durante una edición manual.

- Evita deducir divisas a partir del símbolo `$` sin consentimiento explícito del sitio.
- Mantiene fuera del análisis los formularios de pago, acciones de compra y controles no relacionados.
- Conserva reglas monetarias, tasa bid/ask y almacenamiento anteriores.
- Se agregan pruebas sobre cambios rápidos de planes, ediciones manuales y sincronización tardía, además de las regresiones comerciales y responsivas existentes.
- **No representa una migración completa** del runtime: la interfaz y algunos manejadores de eventos permanecen en JavaScript heredado. La cobertura automatizada no sustituye pruebas reales en Opera GX y Safari.

## Moncevia v3.7.0 — Fase 3: interfaz adaptable y detector modular

La **anotación de precios** ahora se ejecuta desde `src/detector/scan-controller.ts`, separada de la interfaz y de los cálculos financieros. La navegación de cinco pestañas utiliza `src/ui/tab-controller.ts`, con selección por teclado y atributos de accesibilidad. El CSS integra ajustes para celulares, tablets y orientación horizontal sin alterar el diseño de las tiendas.

**Alcance:** refactorización progresiva. El reconocimiento detallado de variantes, los componentes del panel y los conectores restantes siguen en `src/legacy/runtime.js`; no se afirma que toda la interfaz esté migrada a TypeScript. Las tasas, permisos y reglas financieras permanecen sin cambios. Se añadieron pruebas de anotaciones y una matriz de tamaños para Chromium, Firefox y WebKit; aún se requieren pruebas físicas para certificar dispositivos concretos.

## Moncevia v3.6.1 — Fase 2: núcleo financiero tipado

La migración incremental desde JavaScript heredado hacia TypeScript estricto ahora incluye **conversiones monetarias**, **unidades cripto de ocho decimales**, **validación de respuestas FX** y **validación de cotizaciones almacenadas**. La detección de precios, las interfaces y otros adaptadores permanecen en `src/legacy/runtime.js` hasta su propia revisión. La instalación sigue siendo idéntica y el código compilado se genera desde una fuente única.

**Cambios internos, no una garantía de tasas bancarias ni de comisiones de retirada.** Los tests unitarios cubren bid/ask, paridad USDT/USD, vigencia, ajustes manuales y registros malformados. La compatibilidad requiere también superar las regresiones Chromium, Firefox y WebKit; las pruebas físicas de cada navegador siguen siendo independientes.

## Moncevia v3.6.0 — Motor compilado y CSS modular (migración por etapas)

El desarrollo ahora parte de `src/`, con **TypeScript estricto para los módulos migrados**, CSS separado y compilación reproducible hacia el userscript y ambas extensiones nativas. La lógica heredada todavía reside en JavaScript y seguirá migrándose gradualmente: **no se afirma una conversión completa a TypeScript**.

- La instalación del usuario no cambia: `moncevia.user.js` o la extensión de su navegador.
- El código generado no se edita manualmente; los tres engines se construyen desde una única fuente.
- Consultar [arquitectura y comandos de desarrollo](docs/ARCHITECTURE.md).
- Sin cambios de permisos, fuentes de cotización ni fórmulas financieras en esta etapa.

## Moncevia v3.5.5 — Sincronización universal de precios / Dynamic product prices

**Problema corregido:** en algunas tiendas, tocar un botón o una variante no actualizaba la calculadora porque el precio se mostraba en otra sección del producto. Se identifica un precio principal explícito y único, se espera su actualización asincrónica y se evita que un resumen anterior sobrescriba la variante reciente.

- Variantes: tarjetas con precio, botones sin precio, selecciones en formularios y cantidades.
- Seguridad: un catálogo con varios precios no se considera un solo producto; se excluyen enlaces de compra, navegación y controles sin relación.
- Monedas: los símbolos ambiguos como `$` requieren confirmar la moneda por sitio.
- **Uso:** autoriza el sitio, selecciona un plan/talla/opción y verifica que Moncevia muestre el importe y la divisa correctos. Si el precio del comercio no se actualiza, Moncevia puede conservar el último dato verificado. Nunca sustituye el total final del checkout.
- **Pruebas:** escenarios DOM representativos de tiendas, escritorio y móvil; no implica certificación física de cada navegador ni prueba de compra real.

**English:** Variant clicks now follow a uniquely identifiable live product price even when the clicked button has no price of its own. Stale summaries cannot overwrite newer selections; ambiguous currencies still require site-specific confirmation.

## Moncevia v3.5.4 — Botón flotante móvil / Draggable floating launcher

El botón **«CLP · ₿»** se puede mover con el dedo (iPhone/Android), con el mouse (PC/laptop) y mediante las flechas del teclado cuando tiene el foco (**Mayús + flecha** avanza más). **Tócalo para abrir** Moncevia. Arrastrarlo no abre el panel ni altera la página.

La posición se guarda **localmente por navegador o gestor**, se ajusta al cambiar el tamaño de la pantalla y no mueve el panel principal. Para volver a la esquina inferior derecha utiliza **Ajustes → General y sitio actual → Restablecer posición del botón**.

**English:** Drag the CLP · ₿ button with touch or mouse; press arrow keys while focused (Shift for larger steps). A tap opens Moncevia. Its viewport-relative position is saved locally. Reset from Settings → General & current site → Reset floating button position.

## v3.5.3 — Apertura ágil / Faster panel opening

Moncevia muestra primero el panel y actualiza los cálculos después del primer dibujo de la interfaz. El historial solo se reconstruye cuando abres su pestaña, y la localización agrupa cambios para reducir trabajo repetido. **No cambia conversiones, API, permisos ni la selección de precios de Kumori/RIFT.** La comprobación de rendimiento es automatizada en Chromium, no una medición física de Safari.

# Moncevia

## v3.5.2 — Detección de tarifas estáticas / Static pricing detection

Algunas tiendas muestran tarjetas de precios con símbolos ambiguos como `$10` sin identificador de moneda. Moncevia **no supone automáticamente que ` significa USD**. Autoriza el sitio, toca el precio o usa **Seleccionar en web** y confirma una sola vez si ` representa USD, CLP, CAD o AUD en ese dominio. La preferencia se guarda localmente y las demás tarifas se reconocerán sin introducir los importes a mano. También puedes definir la moneda en **Ajustes → General y sitio actual → Moneda de $ en este sitio**.

El reconocimiento funciona en tarjetas estáticas, incluso si no tienen controles de selección. Las anotaciones son informativas y no interceptan los botones originales de compra. Los sitios con precios en EUR, GBP, otras divisas explícitas o criptomonedas siguen funcionando como antes. **KumoriBot es un ejemplo de prueba, no una dependencia del script.** Los precios mostrados por la tienda y el cobro final no se modifican.

**English:** For unlabeled ` prices, authorize the website, tap a static price and choose its currency once (USD, CLP, CAD or AUD). Moncevia then recognizes other prices on that domain. It does not silently interpret ` as USD and never changes the site's checkout controls.

## Novedad v3.5.1 — Cualquier par de monedas / Any currency pair

El módulo **Convertir** permite seleccionar **moneda de origen y moneda de destino** de forma independiente: CLP, USD, EUR, GBP, CAD, AUD, JPY, KRW, BRL, CNY, BTC, ETH y LTC. El botón **⇄** invierte el par; el resultado principal corresponde a la moneda de destino, no siempre a CLP. La selección de un precio de un sitio autorizado actualiza el origen sin fijar el destino. **RIFT se utiliza únicamente para pruebas**, no es un requisito ni una limitación. La versión desktop beta 0.1.1 reutiliza el mismo motor.

**English:** Select source and target currencies independently, swap the pair, and convert across all 13 supported fiat and crypto currencies on any compatible authorized website. A missing or stale quote is reported as unavailable. Crypto payments remain a separate estimate-only module.


## Extensión nativa para PC / Native desktop extension (beta)

La edición **0.1.2 beta** reutiliza el motor del userscript y ofrece una instalación sin Tampermonkey en **Chrome, Edge, Opera/Opera GX, Brave y Vivaldi** para PC/laptop. En Firefox de escritorio existe un paquete de prueba temporal, pendiente de firma oficial. Android Firefox y Safari iOS siguen utilizando el userscript universal.

**Tutorial por dispositivo y navegador:** [Guía de instalación ES/EN](docs/INSTALLATION.md). Para PC Chromium descarga el ZIP del repositorio, extráelo y carga **`extension/chromium`** como extensión descomprimida desde la página de extensiones con Modo desarrollador. Firefox permite pruebas temporales desde **`extension/firefox`**, pero no una instalación permanente hasta que Mozilla firme el complemento.

**Estado:** prototipo beta probado mediante mocks y regresiones del motor; no ha sido instalado físicamente en todos los navegadores ni está publicado en tiendas. No requiere credenciales ni acceso a carteras. No instala actualizaciones automáticamente. Consulta [estado y límites](docs/EXTENSION_STATUS.md).


**Currency & Crypto Companion — universal browser userscript**

Moncevia helps estimate the Chilean peso (CLP) equivalent of displayed prices and compare selected cryptocurrency payment paths. It is a **read-only, informational** browser userscript; it neither trades nor transfers funds and is **not affiliated with Binance**.

**Version:** 3.5.5 · [Install script](https://raw.githubusercontent.com/qiaminZ/Moncevia/main/moncevia.user.js)

## Soporte multiplataforma / Cross-platform v3.5.0

Un **único script** funciona mediante Userscripts en Safari iOS, Violentmonkey/Tampermonkey en Firefox Android, y estos gestores en Firefox, Chrome, Edge, Opera, Brave y otros navegadores de escritorio compatibles. El núcleo financiero se conserva: la v3.5.0 incorpora un adaptador para las API modernas `GM.*` y clásicas `GM_*`, además de un panel más amplio en PC/laptop.

**Cómo instalar:** abre el [script oficial](https://raw.githubusercontent.com/qiaminZ/Moncevia/main/moncevia.user.js) desde el navegador que tenga el gestor instalado. En Android se recomienda Firefox con [Violentmonkey](https://addons.mozilla.org/en-US/android/addon/violentmonkey/) o [Tampermonkey](https://addons.mozilla.org/en-US/android/addon/tampermonkey/). En Windows/macOS/Linux, instala uno de esos gestores desde la tienda oficial de extensiones del navegador. En Safari iOS continúa la instalación en la carpeta de Userscripts.

**Límites:** Chrome oficial para Android no admite extensiones convencionales. La compatibilidad no se garantiza en navegadores sin gestores ni en cada sitio web. Las preferencias son independientes en cada navegador. Las pruebas realizadas son de Chromium simulado; se requiere validación física de Android Firefox, Safari y escritorio Firefox.

Consulta [la matriz de compatibilidad y solución de problemas](docs/COMPATIBILITY.md).

**English:** One script works through compatible userscript managers on iOS Safari, Android Firefox and Chromium/Firefox desktop browsers. Official Android Chrome does not support traditional extensions. Real-device tests are still needed.

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
python tests/test_i18n.py
python tests/test_cross_platform.py
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
