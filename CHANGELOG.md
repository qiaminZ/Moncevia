# Changelog

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