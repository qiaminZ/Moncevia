# Changelog

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