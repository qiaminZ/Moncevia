# Moncevia — Arquitectura de ingeniería (v3.6.0)

## Objetivo

Mantener un **único código fuente** para el userscript iOS/Android y las extensiones Chromium y Firefox. TypeScript y CSS son herramientas de desarrollo: los usuarios instalan JavaScript compilado, sin dependencias en tiempo de ejecución.

## Estructura

- `src/entry/index.ts`: punto de entrada del bundle.
- `src/core/parse-amount.ts`: primer módulo financiero migrado a TypeScript estricto.
- `src/types/currency.ts`: tipos y conjuntos de monedas.
- `src/styles/moncevia.css`: estilos reales separados, integrados en el bundle como texto; no se solicita CSS a servidores externos.
- `src/legacy/runtime.js`: lógica restante en JavaScript durante la migración. **Todavía no está tipada**; pasarla a TS sin pruebas incrementaría el riesgo de regresiones.
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
2. **Fase 2:** migración incremental de conversiones, validadores de APIs y almacenamiento al núcleo tipado, con pruebas unitarias por función.
3. **Fase 3:** descomposición de detección DOM e interfaz; perfiles de rendimiento y accesibilidad multiplataforma.

No se afirma que toda la aplicación esté escrita en TypeScript mientras siga existiendo `src/legacy/runtime.js`. No se modifican tasas, comisiones ni permisos en esta fase.

## Distribución

Las versiones públicas se publican en `main` solo tras aprobación de CI en Chromium, Firefox y WebKit. Las extensiones nativas usan el mismo engine compilado. La firma de Mozilla y la publicación en tiendas siguen siendo procesos independientes de la compilación.
