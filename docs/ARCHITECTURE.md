# Moncevia — Arquitectura de ingeniería (v3.12.0)

## Objetivo

Mantener un **único código fuente** para el userscript iOS/Android y las extensiones Chromium y Firefox. TypeScript y CSS son herramientas de desarrollo: los usuarios instalan JavaScript compilado, sin dependencias en tiempo de ejecución.

## Estructura

- `src/entry/index.ts`: punto de entrada del bundle.
- `src/core/parse-amount.ts`: análisis de importes con tipado estricto.
- `src/core/conversion.ts`: conversiones puras entre CLP, divisas y criptomonedas, con bid/ask y vigencia.
- `src/core/crypto-units.ts`: aritmética exacta de ocho decimales para retiros.
- `src/core/fx-validation.ts`: validación de respuestas externas FX.
- `src/core/cache-validation.ts`: lectura defensiva de tasas y cotizaciones desde almacenamiento local.
- `src/core/settings-validation.ts`: normalización estricta de preferencias persistidas y consentimientos de dominios.
- `src/core/provider-validation.ts`: validación estricta de respuestas públicas Binance, CoinGecko y Coinbase.
- `src/types/currency.ts`: tipos y conjuntos de monedas.
- `src/styles/moncevia.css`: estilos reales separados, integrados en el bundle como texto; no se solicita CSS a servidores externos.
- `src/detector/scan-controller.ts`: recorrido DOM, anotaciones de precios, filtrado de mutaciones propias y reescaneo programado; no modifica precios originales.
- `src/detector/variant-detector.ts`: reconocimiento conservador de tarjetas, variantes, precios principales y símbolos ambiguos; no modifica el comercio.
- `src/detector/selection-scheduler.ts`: programación y cancelación de comprobaciones posteriores a cambios asincrónicos de producto.
- `src/ui/tab-controller.ts`: navegación por pestañas, atributos ARIA y teclado.
- `src/ui/fab-controller.ts`: geometría, arrastre, teclado y persistencia de posición del botón flotante, sin alterar componentes de tiendas.
- `src/platform/gm-bridge.ts`: interfaz tipada para almacenamiento y peticiones públicas de userscript managers modernos y heredados, sin credenciales ni acceso a las tiendas.
- `src/i18n/catalog.ts`: catálogo ES→EN, fragmentos dinámicos y resolución del idioma Auto.
- `src/i18n/localizer.ts`: actualización reversible y limitada al widget de textos y atributos de accesibilidad mediante observador de mutaciones.
- `src/legacy/runtime.js`: integración y lógica restante en JavaScript durante la migración. **Todavía no está tipada**; pasarla a TS sin pruebas incrementaría el riesgo de regresiones.
- `src/meta/userscript.header.txt`: encabezado y permisos del userscript.
- `scripts/build.mjs`: compilación con esbuild y tres salidas idénticas.
- `moncevia.user.js` y `extension/{chromium,firefox}/engine.js`: artefactos generados para instalación; no se editan manualmente.

## Desarrollo

Node.js 22+:

```sh
npm ci
npm run typecheck
npm run lint
npm run test:core
npm run build
npm run build:check
python scripts/build_native.py
```

El compilador **no** ejecuta transacciones ni lee wallets. Las APIs públicas y el almacenamiento local conservan los controles existentes. Los usuarios no necesitan Node.js, npm o TypeScript para instalar Moncevia.

## Etapas y honestidad del estado

1. **Fase 1 (este cambio):** CSS aislado, primer módulo financiero estrictamente tipado, un solo proceso de build, lockfile, pruebas y artefactos nativos.
2. **Fase 2 (v3.6.1, en ejecución):** conversiones, validación FX y cachés financieras migradas a TypeScript, con pruebas unitarias. Permanecen pendientes la normalización completa de ajustes y los proveedores cripto externos, junto con futuras migraciones del runtime.
3. **Fase 3 (v3.7.0):** escaneo y anotaciones DOM separados, controlador de pestañas tipado, ajustes responsivos y nuevas regresiones multi-viewport. El reconocedor profundo de variantes, gestión avanzada de eventos y módulos visuales aún se migrarán de forma incremental; no se presupone que todo el runtime sea TypeScript.

4. **Fase 4 (v3.8.0):** detector de variantes tipado, cancelación de reintentos obsoletos y protección de edición manual. Se amplían las pruebas de eventos y compatibilidad sin cambiar permisos, tasas o pagos.

5. **Fase 5 (v3.9.0):** validación y normalización de configuraciones persistidas, fronteras tipadas para proveedores de criptomonedas y pruebas de respuestas obsoletas/corruptas. Se conserva la integración visual y parte de los adaptadores JS heredados.

6. **Fase 6 (v3.10.0):** catálogo ES/EN y localización del widget migrados a módulos tipados, con pruebas de accesibilidad textual, atributos ARIA y restauración de idioma en Chromium, Firefox y WebKit. Los demás componentes aún pueden permanecer en JavaScript heredado.

7. **Fase 7 (sin cambio de versión):** pruebas end-to-end adicionales con recorridos completos, teclado, selección de importes y privacidad en tres motores; certificación física por separado.

8. **Fase 8 (v3.11.0):** extracción tipada del botón flotante y sus límites responsivos, con pruebas unitarias y de regresión. Persisten UI, acceso GM y parte de eventos financieros en el runtime heredado.

9. **Fase 9 (v3.12.0):** extracción del adaptador GM de almacenamiento y red a TypeScript estricto, con compatibilidad asincrónica y callbacks antiguos, pruebas unitarias y regresión multi-motor. Aún quedan lógica de persistencia y componentes visuales heredados.

No se afirma que toda la aplicación esté escrita en TypeScript mientras siga existiendo `src/legacy/runtime.js`. No se modifican tasas, comisiones ni permisos en esta fase.

## Distribución

Las versiones públicas se publican en `main` solo tras aprobación de CI en Chromium, Firefox y WebKit. Las extensiones nativas usan el mismo engine compilado. La firma de Mozilla y la publicación en tiendas siguen siendo procesos independientes de la compilación.
