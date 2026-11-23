## 3.14.0 / Desktop 0.10.0-beta — Phase 11: typed panel shell and UI components

- Extracted DOM helpers (disclosures, rows, links, text and CSS attachment) to strict `src/ui/dom-factory.ts`.
- Extracted the owned floating launcher, status header, language control, rate sources, and accessibility attributes to `src/ui/panel-shell.ts`.
- Preserved the merchant isolation boundary, navigation, HTML classes, public rate links, stored preferences, financial logic and permissions.
- Added cross-browser desktop/mobile panel regression checks; full prior suites remain mandatory.
- Complex UI forms and finance rendering remain in `src/legacy/runtime.js`. Real Safari iOS and Opera GX certification remains outstanding.

## 3.13.0 / Desktop 0.9.0-beta — Phase 10: typed persistence and consent lifecycle

- Extracted startup restoration and ordered settings/history writes to `src/platform/persistence-controller.ts`; preserved `clplens_v1`, `clplens_usd_rates_v1`, `clplens_crypto_rates_v2` and `clplens_history_v3`.
- Restores storage keys independently so a corrupt or unavailable rate cache does not discard valid site consent, preferences or history.
- Captures immutable snapshots before queuing asynchronous writes, preserving the user's update order across modern and legacy userscript managers.
- Enforces durable opt-in: never activates an unapproved merchant site or requests public quotations until its permission was stored successfully. Failed writes restore in-memory consent and leave the prompt available.
- Serializes explicit permission revocation after prior writes; a failed revocation does not reload the page or pretend permission was removed. Clear-history failure no longer falsely clears the visible history.
- Adds Vitest fault-injection and sequence tests, plus Chromium/Firefox/WebKit integration checks on desktop and emulated mobile. No changes to exchange rates, fees, network hosts, checkout exclusions or browser permissions.
- Physical Safari iOS, VoiceOver and Opera GX installation checks remain independent.

## 3.12.0 / Desktop 0.8.0-beta — Phase 9: typed GM storage and transport boundary

- Extracted the modern/legacy userscript-manager adapter into strict `src/platform/gm-bridge.ts`: `GM.getValue`, `GM.setValue`, `GM.xmlHttpRequest`, `GM_getValue`, `GM_setValue`, and `GM_xmlhttpRequest`.
- Preserved per-method modern precedence, callback-only transport, async modern implementations, synchronous legacy storage and once-only HTTP response settling.
- Added unit tests for fallback, failures, duplicate completions and callback errors, plus a multi-engine legacy-manager browser journey on emulated desktop and mobile.
- Kept local storage keys, existing public quote hosts, merchant consent model, conversion algorithms, checkout exclusions, and extension permissions unchanged.
- This is a staged migration: visual UI, request scheduling and portions of data persistence still run in the legacy runtime. Physical Safari/Opera GX tests remain pending.

## 3.11.0 / Desktop 0.7.0-beta — Phase 8: typed floating launcher

- Extracted the floating button's pointer/touch, keyboard, resize, restore, reset and normalized-position logic into strict `src/ui/fab-controller.ts`.
- Kept original DOM, stored settings key, visual positions, event handlers and drag safeguards.
- Added unit tests for bounds, clamp logic, normalized coordinates and degenerate viewport geometry. Existing drag/touch and phase 7 cross-engine journeys remain mandatory CI gates.
- No financial changes, additional permissions, account access or new API requests; remaining UI and adapters still use legacy JavaScript.
- Physical Opera GX and Safari iOS verification remains independent of automated emulation.

## 3.10.0 / Desktop 0.6.0-beta — Phase 6: typed internationalization

- Moved the existing Spanish-English phrase catalog and dynamic fragments out of legacy runtime into typed `src/i18n/catalog.ts`.
- Added a reversible DOM-scoped localization controller (`src/i18n/localizer.ts`) for text, placeholders, titles, ARIA labels, the language button and the preference selector.
- Preserved the language preference precedence (explicit ES/EN over browser Auto) and local data storage; merchant page text is never translated.
- Added pure unit coverage for locale resolution, static warnings, dynamic rates and fragment catalog integrity, plus cross-engine Playwright checks on mobile/desktop with dynamic labels.
- No new network requests, permissions or financial changes. Some visual UI and lifecycle integration remains in legacy JavaScript; real VoiceOver/Opera GX device testing remains separate.

## 3.9.0 / Desktop 0.5.0-beta — Phase 5: typed settings and provider boundaries

- Migrated persisted preference normalization into strict TypeScript, retaining known valid site consents and rejecting malformed options, unknown keys and invalid position/currency values.
- Migrated public Binance bookTicker, CoinGecko USDT/USD parity, CoinGecko USD fallback and Coinbase spot response validation to typed providers.
- Added unit tests covering ticker symbol ordering, bid/ask spread, stale/future timestamps, invalid responses, currency precedence and site-authorization integrity.
- Kept the same storage keys, public API endpoints, opt-in site model, fee formulas, checkout exclusions and browser UI.
- Binance and Coinbase spot responses do not provide source quote timestamps; local fetch time governs their indicative cache age.
- Source refactor only; no new financial capabilities, wallets or permissions.

## 3.8.0 / Desktop 0.4.0-beta — Phase 4: typed variant detector & event lifecycle

- Migrated variant-card, selected-summary, main-product-price, text extraction and ambiguous `$` selection logic from legacy JavaScript into a typed read-only DOM detector.
- Added cancellable, deduplicated retry scheduling for rapid variant clicks and asynchronous storefront updates.
- Preserved manually entered amounts by cancelling scheduled scans on input focus and change; callbacks still require active site authorization.
- Added unit tests covering ambiguous currencies, historical/per-unit prices, retry replacement and manual-override protections.
- Added cross-browser manual-edit/rapid-variant regression tests in desktop and emulated mobile sizes.
- No new hosts, APIs, permissions, financial formula changes or merchant checkout interaction. Remaining UI and event integration stays in JavaScript until independently verified.

## 3.7.0 / Desktop 0.3.0-beta — Phase 3: responsive UI and DOM scanner

- Extracted DOM price annotation scanning, badge rendering, debounced rescan and own-mutation filtering to a TypeScript module.
- Extracted semantic tab activation and keyboard navigation to an independent typed UI controller.
- Added constrained responsive styles for narrow phones, tablets and short landscape viewports; never modifies merchant layouts.
- Added floating-launcher aria-expanded state linked to the visibility of the Moncevia panel.
- Added a viewport/keyboard regression matrix across Chromium, Firefox and WebKit, plus price-badge mutation tests and focused unit checks.
- Preserved finance formulas, public rate providers, stored preference keys, and site authorization behavior. Part of the interactive UI and variant selection still uses the legacy JS runtime.

## 3.6.1 / Desktop 0.2.1-beta — Phase 2: typed financial core

- Extrae las conversiones CLP, divisas y BTC/ETH/LTC a un núcleo TypeScript puro con tasas bid/ask e indicador USDT/USD.
- Mueve unidades exactas de criptomonedas (10^-8) y redondeos de estimación a `src/core/crypto-units.ts`.
- Valida respuestas públicas de ExchangeRate-API y registros de caché FX/cripto antes de utilizarlos.
- Añade pruebas unitarias de conversiones, valores obsoletos, importes manuales, precisión, datos corruptos y vigencia.
- Sin nuevos permisos ni cambios deliberados de interfaz, APIs o redondeos de transacciones.
- La detección DOM, los controladores de interfaz y otros componentes permanecen como JavaScript heredado durante la migración progresiva.

## 3.6.0 / Desktop 0.2.0-beta — Engineering migration (staged)

- Introduced TypeScript strict for the currency parser and currency definitions, while retaining the remaining runtime in JavaScript during migration.
- Extracted CSS into `src/styles/moncevia.css`; the build embeds styles, requiring no external CSS fetch.
- Added one esbuild-based compilation path for the userscript and native Chromium/Firefox engines, with generated artifact parity checks.
- Added npm toolchain, dependency lockfile, ESLint, Prettier and Vitest unit tests.
- Unchanged: financial conversion formulas, exchange providers, permission scope and checkout safeguards.
- Existing 72 browser-matrix cases and platform regression tests remain the release gate; physical browser testing is still required.

## 3.5.5 / Desktop 0.1.5-beta — 2026-11-21

- Corrige la sincronización de variantes cuando el botón no incluye el precio o cuando el importe principal cambia por JavaScript tras el clic.
- Evita que un precio/resumen antiguo sustituya una selección nueva durante actualizaciones asincrónicas.
- Detecta precios principales únicos con marcadores de producto habituales; evita escoger un precio arbitrario de un catálogo.
- Mantiene una elección manual cuando el usuario toca filtros o controles no relacionados.
- Permite confirmar moneda ambigua `$` también en botones de variante.
- Pruebas reproducibles de 12 patrones de comercio en tamaños de escritorio/móvil y motores Chromium, Firefox y WebKit (72 ejecuciones, según resultados de CI).
- Mantiene el modelo de autorización por sitio y las mismas fuentes de tasas y fórmulas financieras.
- Sigue pendiente la verificación física en Opera GX/Firefox/Safari de las tiendas reales.

## 3.5.4 / Desktop 0.1.4-beta — 2026-11-21

- Botón flotante arrastrable por dedo o mouse; también responde a flechas del teclado cuando tiene el foco.
- Se evita que el gesto de arrastre active un clic accidental.
- La posición relativa se guarda localmente, se conserva al recargar y se limita al área visible al cambiar tamaño u orientación.
- Nuevo botón en Ajustes > General para restablecer su ubicación predeterminada.
- El panel conserva su posición; no se modifican fórmulas financieras, fuentes de datos ni permisos.
- Prueba automatizada para móvil y PC con persistencia, redimensionamiento y acceso habitual por toque.

## 3.5.3 / Desktop 0.1.3-beta — 2026-11-20

- El botón flotante muestra el panel antes de reconstruir cálculos, evitando bloquear el primer dibujo con operaciones de DOM.
- Agrupa los trabajos de localización por fotograma y elimina el renderizado duplicado del modo compacto.
- No reconstruye todo el historial en cada apertura; lo actualiza al entrar en Historial.
- Corrige el indicador de versión del encabezado, antes anclado a 3.4.0.
- Pruebas de apertura instantánea en Chromium móvil/escritorio; pruebas previas de RIFT, Kumori, Binance y otras funciones deben permanecer aprobadas.
- Sin cambios en tasas, cálculos de pago, permisos ni acceso a cuentas.

## 3.5.2 / Desktop 0.1.2-beta — 2026-11-20

- Reconocimiento de tarifas estáticas que no tienen control propio de selección; permite tocar el importe o elegir la tarjeta desde el modo visual.
- El símbolo `$` ambiguo exige seleccionar una vez su moneda por sitio (USD/CLP/CAD/AUD); conserva las preferencias previas que trataban `$` como USD.
- Las etiquetas de conversión no interceptan clics originales de la página ni alteran compras.
- La sincronización visual ahora admite las 13 monedas del conversor, no solo seis.
- Pruebas con tarjetas genéricas, selección en USD/CLP/CAD, compatibilidad RIFT, accesos excluidos y configuraciones anteriores.
- Motor compartido sincronizado con extensiones Chromium y Firefox. No se realizan operaciones financieras.

## 3.5.1 / Desktop 0.1.1-beta — 2026-11-20

- Nuevo selector de moneda de destino y botón para invertir el par (⇄).
- Conversión cruzada entre 10 divisas (incluido CLP) y BTC/ETH/LTC, con el mismo motor universal; el resultado principal ahora usa el destino elegido.
- Si CLP se selecciona como origen, se evita por defecto el resultado redundante CLP→CLP (el destino pasa a USD, pero puedes elegir el mismo par manualmente).
- Guarda el par elegido en el historial y conserva la compatibilidad con consultas anteriores.
- Moneda de origen dinámica al seleccionar cualquier precio reconocido; RIFT es un ejemplo de prueba, no una dependencia.
- Extensiones Chromium y Firefox sincronizadas con el motor 3.5.1 (beta 0.1.1).
- Pruebas de pares en un sitio genérico independiente, además de regresiones de Binance y diseños móviles.

## Native desktop extension 0.1.0-beta — 2026-11-20

- Dos paquetes Manifest V3 basados en un único motor Moncevia v3.5.0.
- Puente de almacenamiento y consultas de cotizaciones públicas con rutas estrictamente limitadas.
- Popup informativo, guía bilingüe por plataforma y pruebas de seguridad del puente.
- No se modifican las fórmulas financieras ni el userscript existente. Firma Firefox y publicación en tiendas pendientes.

## 3.5.0 — 2026-11-20

- Una sola base de código para gestores de userscripts en Safari iOS, Firefox Android y navegadores de escritorio compatibles.
- Puente de API `GM.*` con promesas, callbacks y `GM_*` heredado, sin añadir acceso a credenciales ni métodos privados.
- Panel de PC con ancho 490 px; se conserva el diseño móvil.
- Nuevas pruebas automatizadas para gestores y tamaño de pantalla; documentación y limitaciones por navegador.
- Sin cambios en fórmulas financieras. Chrome Android oficial continúa sin extensiones convencionales.

# Changelog

## 3.4.0 — 2026-11-20

- Interfaz en **español e inglés**, con selección Auto / ES / EN, botón rápido en el encabezado y persistencia local.
- Localización de menús, ajustes, simulador de pagos, comparación, mensajes de seguridad, historial y elementos accesibles.
- Formatos de CLP, cantidades y fechas acordes al idioma elegido; el texto y precio de la tienda permanecen intactos.
- Las cinco vistas conservan la navegación y el comportamiento financiero de 3.3.0.
- Pruebas de regresión en español, cambio de idioma en vivo, visualización en inglés y compatibilidad móvil simulada.
- Sin nuevas operaciones financieras, API privadas ni permisos de red.


## 3.3.0 — 2026-11-20

- Rediseño mobile-first: cinco vistas separadas (**Convertir**, **Pagar**, **Comparar**, **Historial**, **Ajustes**) con pestañas accesibles y navegación de teclado.
- Convertir muestra el equivalente CLP como resultado principal y reúne las monedas alternativas en tarjetas; acciones rápidas sin información de pagos mezclada.
- El simulador usa tarjetas desplegables para BTC, ETH y LTC, indicando estado de verificación y dejando las cifras detalladas disponibles al expandir.
- La comparación queda en su propia vista y los ajustes se agrupan en secciones plegables. Ayuda y fuentes quedan bajo demanda.
- El importe exacto solicitado por un comercio aparece solo al activar la opción correspondiente.
- Conserva almacenamiento, enlaces de actualización, fuentes públicas de mercado y lógica de cálculo de v3.2.0.
- Amplía pruebas automatizadas con navegación entre cinco vistas y comprobación de desbordamiento a 320/375/390 px y en orientación horizontal.
- La versión no se considera validada en Safari iOS físico hasta completar pruebas manuales.


## 3.2.0 — 2026-11-20

- Revoca automáticamente indicadores «verificado» cuando cambian comisiones, margen bancario, costo de fondeo o red de retiro; exige reconfirmación antes de usar esos datos como verificados.
- Exportación voluntaria del historial local a CSV, con protección frente a fórmulas de hojas de cálculo.
- Botón «Revocar acceso a este sitio»: retira autorización y recarga la página. Los sitios desactivados no disparan consultas automáticas de mercado.
- Coordina las solicitudes FX y cripto concurrentes para evitar llamadas duplicadas en cambios de visibilidad y actualizaciones.
- Verifica la fecha del proveedor FX; rechaza tasas con marca de tiempo de más de siete días o del futuro.
- Amplía regresiones en Chromium, documenta instalación y enlace público compartible.
- Mantiene claves de preferencias, historial y enlaces de actualización de v3.1.x.

## 3.1.0 — 2026-11-20

- Primera versión pública de Moncevia preparada para instalar desde GitHub.
- Cotización de Binance BTC/ETH/LTC en **USDT**, sin confundirla con USD: consulta independiente USDT/USD (CoinGecko), con retroceso a datos de mercado USD si no existe cotización confiable.
- Simulador de coste de retiro solo con cotización Binance vigente y datos de comisión explícitos; precisión de suma de importe exacto y comisión mediante unidades enteras de 1e-8 cuando se introducen como números decimales válidos.
- Activación por sitio: RIFT habilitado inicialmente, otros dominios solo tras consentimiento desde botón discreto; sin consultas de tasas antes de autorizar.
- Historial guarda el dominio solo por consentimiento; detección de precio menos propensa a interpretar separadores ambiguos.
- Menos escaneo por pasada, control de visibilidad, atajo Escape para cerrar panel, documentación y pruebas automatizadas.
- Conserva claves de configuración antiguas para migración potencial desde CLP Lens.

## 3.0.1 — 2026-11-20

- Renombrado inicial de CLP Lens a Moncevia; código de v3.0 y preferencias originales.
