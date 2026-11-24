# Moncevia

**Currency & Crypto Companion** — conversor de divisas y criptomonedas para navegadores, con estimaciones en pesos chilenos (CLP).

**Versión:** userscript **v3.15.2** · extensiones para Chromium y Firefox **v0.11.2-beta**.

Moncevia reconoce precios en páginas compatibles, permite convertir entre monedas y ayuda a estimar costos de pagos con criptomonedas. **Es una herramienta informativa: no compra, vende ni transfiere fondos, y no sustituye el importe final indicado por el comercio o el exchange.**

[Instalar userscript](https://raw.githubusercontent.com/qiaminZ/Moncevia/main/moncevia.user.js) · [Guía de instalación](docs/INSTALLATION.md) · [Historial de cambios](CHANGELOG.md)

## Funciones

- **Convertir:** monedas de origen y destino independientes, inversión del par y reconocimiento de precios en sitios autorizados.
- **Pagar:** simulaciones con BTC, ETH y LTC; redes, comisiones y márgenes introducidos o verificados por el usuario.
- **Comparar:** estimaciones orientativas de métodos de pago como Prex, Santander y Binance.
- **Historial:** hasta 30 consultas guardadas localmente, reutilización y exportación CSV voluntaria.
- **Ajustes:** permisos por sitio, idioma Auto/ES/EN, tasas manuales, modo compacto y posición del botón flotante.

**Monedas:** CLP, USD, EUR, GBP, CAD, AUD, JPY, KRW, BRL, CNY, BTC, ETH y LTC.

Las cotizaciones públicas proceden de fuentes como ExchangeRate-API, Binance Spot, CoinGecko y Coinbase. Su disponibilidad y vigencia pueden variar; los importes mostrados son aproximados.

## Instalación

| Plataforma | Método |
| --- | --- |
| **iPhone / iPad — Safari** | Extensión **Userscripts** para Safari y archivo [moncevia.user.js](https://raw.githubusercontent.com/qiaminZ/Moncevia/main/moncevia.user.js). |
| **Windows / macOS / Linux — Chromium** | Extensión de prueba descomprimida desde `extension/chromium` (Chrome, Edge, Opera/Opera GX y compatibles), o gestor de userscripts. |
| **Firefox de escritorio** | Gestor de userscripts o instalación temporal de `extension/firefox`; la distribución permanente exige los requisitos de firma de Mozilla. |
| **Android — Firefox** | Gestor compatible de userscripts y archivo `moncevia.user.js`. |

Consulta la **[guía completa](docs/INSTALLATION.md)** y la **[matriz de compatibilidad](docs/COMPATIBILITY.md)** para pasos específicos y solución de problemas.

Al entrar en un sitio nuevo, Moncevia solicita autorización antes de activar el escaneo y las consultas de cotización. Desactiva instalaciones antiguas o duplicadas antes de actualizar.

## Privacidad y límites

- **Consentimiento por dominio:** puedes autorizar o revocar un sitio desde la interfaz. Los formularios de pago, contraseñas y otros contextos sensibles cuentan con exclusiones preventivas.
- **Datos locales:** preferencias e historial se guardan en el almacenamiento del navegador o gestor; Moncevia no envía tu historial a un servidor propio.
- **Solicitudes externas:** los proveedores públicos de cotizaciones pueden recibir la IP asociada a la consulta.
- **Estimaciones financieras:** verifica siempre importe, red y comisiones reales antes de efectuar cualquier pago fuera de Moncevia. No introduzcas credenciales ni claves API.

Más información: [Privacidad](PRIVACY.md) · [Seguridad](SECURITY.md).

## Desarrollo y pruebas

Requiere **Node.js 22+** para compilar desde el código fuente.

```bash
npm ci
npm run typecheck
npm run lint
npm run test:core
npm run build
npm run build:check
```

El código fuente reside en `src/` y genera el userscript y los dos motores de extensión desde una base común. Consulta la [arquitectura](docs/ARCHITECTURE.md).

Las regresiones automáticas cubren Chromium, Firefox y WebKit, incluidas emulaciones de pantalla móvil, privacidad, conversiones y escenarios comerciales. **La instalación física en Safari iOS y Opera GX aún necesita validación**; las extensiones siguen siendo **beta**, no versiones aprobadas en las tiendas.

[Plan de pruebas físicas](docs/QA_DEVICE_MATRIX.md) · [Estado de preparación de lanzamiento](docs/RELEASE_READINESS.md) · [Changelog completo](CHANGELOG.md)

## Licencia

Código público con **todos los derechos reservados**, hasta que la persona titular establezca expresamente una licencia. La disponibilidad en GitHub no concede automáticamente permisos de redistribución o creación de derivados.

---

**English:** Moncevia is a read-only browser currency and cryptocurrency companion. Install the userscript with a compatible manager, approve each supported website explicitly, and verify live exchange rates, fees and the final merchant amount before any payment. See the [installation guide](docs/INSTALLATION.md) and [release status](docs/RELEASE_READINESS.md). Physical Safari iOS and Opera GX validation remains pending.
