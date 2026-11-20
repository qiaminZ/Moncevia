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
