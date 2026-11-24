# Moncevia — Arquitectura de ingeniería (v3.15.3)

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
- `src/ui/dom-factory.ts`: construcción tipada de elementos propios, enlaces externos seguros, filas y controles plegables.
- `src/ui/panel-shell.ts`: cabecera, botón flotante y estructura visual inicial sin modificar tiendas.
- `src/ui/tab-controller.ts`: navegación por pestañas, atributos ARIA y teclado.
- `src/ui/fab-controller.ts`: geometría, arrastre, teclado y persistencia de posición del botón flotante, sin alterar componentes de tiendas.
- `src/platform/gm-bridge.ts`: interfaz tipada para almacenamiento y peticiones públicas de userscript managers modernos y heredados, sin credenciales ni acceso a las tiendas.
- `src/platform/page-lifecycle.ts`: orquestador tipado de eventos, observadores, reanudación BFCache y colas de mutaciones en un cuadro de animación.
- `src/platform/persistence-controller.ts`: recuperación independiente de preferencias, cachés e historial, escrituras serializadas, y resultado explícito de consentimientos guardados o rechazados.
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

1. **Fase 1:** CSS aislado, primer módulo financiero estrictamente tipado, un solo proceso de build, lockfile, pruebas y artefactos nativos.
2. **Fase 2 (v3.6.1):** conversiones, validación FX y cachés financieras migradas a TypeScript, con pruebas unitarias. La normalización posterior de ajustes y proveedores externos se completó en fases siguientes; el runtime heredado sigue en migración parcial.
3. **Fase 3 (v3.7.0):** escaneo y anotaciones DOM separados, controlador de pestañas tipado, ajustes responsivos y nuevas regresiones multi-viewport. El reconocimiento de variantes, la gestión avanzada de eventos y los componentes visuales se abordaron posteriormente; aún existe integración heredada que no se considera completamente TypeScript.

4. **Fase 4 (v3.8.0):** detector de variantes tipado, cancelación de reintentos obsoletos y protección de edición manual. Se amplían las pruebas de eventos y compatibilidad sin cambiar permisos, tasas o pagos.

5. **Fase 5 (v3.9.0):** validación y normalización de configuraciones persistidas, fronteras tipadas para proveedores de criptomonedas y pruebas de respuestas obsoletas/corruptas. Se conserva la integración visual y parte de los adaptadores JS heredados.

6. **Fase 6 (v3.10.0):** catálogo ES/EN y localización del widget migrados a módulos tipados, con pruebas de accesibilidad textual, atributos ARIA y restauración de idioma en Chromium, Firefox y WebKit. Los demás componentes aún pueden permanecer en JavaScript heredado.

7. **Fase 7 (sin cambio de versión):** pruebas end-to-end adicionales con recorridos completos, teclado, selección de importes y privacidad en tres motores; certificación física por separado.

8. **Fase 8 (v3.11.0):** extracción tipada del botón flotante y sus límites responsivos, con pruebas unitarias y de regresión. Persisten UI, acceso GM y parte de eventos financieros en el runtime heredado.

9. **Fase 9 (v3.12.0):** extracción del adaptador GM de almacenamiento y red a TypeScript estricto, con compatibilidad asincrónica y callbacks antiguos, pruebas unitarias y regresión multi-motor. Aún quedan lógica de persistencia y componentes visuales heredados.

10. **Fase 10 (v3.13.0):** separación del arranque de datos y la persistencia de ajustes/historial, recuperación parcial ante fallos, autorización efectiva solo tras guardado confirmado y pruebas con gestores de almacenamiento simulados. Aún permanecen renderizado, controles del panel y parte del ciclo de vida DOM en JavaScript heredado.

11. **Fase 11 (v3.14.0):** extracción del encabezado y componentes DOM visuales a TypeScript, conservando clases, atributos ARIA y comportamiento en tres motores. Las secciones financieras y formularios complejos permanecen parcialmente heredados.

12. **Fase 12 (v3.15.0):** se trasladan observador principal, eventos y reactivación BFCache a TypeScript, con agrupación de cambios DOM por frame y limpieza al salir. No se cambia el motor financiero ni la política de autorización.

13. **Fase 13 (sin cambio de versión):** pruebas de estrés adicionales con 180 precios, ráfagas de mutaciones, límite de anotaciones, respeto de controles comerciales, formularios ocultos y bloqueo de contextos sensibles en Chromium/Firefox/WebKit. La certificación física no es sustituida por emulación.

14. **Fase 14 (sin versión nueva):** auditoría reproducible de manifests, permisos, claves de red, paridad de motores, documentación de riesgos y matriz física pendiente. La etiqueta de estable queda bloqueada hasta completar las pruebas físicas y, cuando corresponda, firma/publicación en tiendas.

No se afirma que toda la aplicación esté escrita en TypeScript mientras siga existiendo `src/legacy/runtime.js`. No se modifican tasas, comisiones ni permisos en esta fase.

## Distribución

Las versiones públicas se publican en `main` solo tras aprobación de CI en Chromium, Firefox y WebKit. Las extensiones nativas usan el mismo engine compilado. La firma de Mozilla y la publicación en tiendas siguen siendo procesos independientes de la compilación.
