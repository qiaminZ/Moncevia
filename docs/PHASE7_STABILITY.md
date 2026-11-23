# Moncevia — Fase 7: estabilización y compatibilidad real

**Línea base:** userscript 3.10.0; extensiones 0.6.0-beta. Esta etapa agrega pruebas y un protocolo de certificación. No cambia el motor financiero, el userscript generado, las fórmulas, las fuentes de tasas, el almacenamiento, los permisos ni el número de versión.

## Regresión automatizada: puerta de integración

\`tests/test_phase7_user_journey.py\` se ejecuta en **Chromium, Firefox y WebKit**, sobre viewport de escritorio (1366×768) y móvil emulado (390×844). Cada recorrido verifica:

1. Botón flotante, visibilidad del panel y estado ARIA al abrir/cerrar.
2. Selección de plan y cantidad con sincronización del precio original en la calculadora.
3. Navegación por teclado entre pestañas y estado \`aria-selected\`.
4. Traducción ES→EN→ES sin modificar etiquetas ni precio del comercio.
5. Edición manual que resiste actualizaciones pendientes y se reemplaza solo después de una nueva selección.
6. Controles nativos de la tienda que continúan recibiendo sus clics.
7. Dominio no autorizado: sin consultas financieras ni widget hasta obtener permiso expreso.
8. Ausencia de errores JavaScript no capturados.

El pipeline existente sigue ejecutando conversiones, seguridad de fuentes, 72 escenarios de tiendas, 30 viewports responsivos, 6 escenarios de internacionalización y validación de extensiones.

## Certificación pendiente en dispositivos reales

Las pruebas automáticas emulan motores; **no demuestran funcionamiento físico** de Safari con Userscripts en iPhone, Opera GX en Windows, Firefox Android, lectores de pantalla ni instalación de extensiones desde tiendas.

### iPhone — Safari / Userscripts

- [ ] Activar script desde Userscripts y aprobar únicamente una tienda de prueba.
- [ ] Abrir/cerrar panel al tocar el botón, arrastrarlo y comprobar que permanece visible tras rotación.
- [ ] Cambiar variante y cantidad; contrastar importe de Moncevia con importe mostrado por la tienda.
- [ ] Introducir importe manual y confirmar que la página no lo sobrescribe sin una selección nueva.
- [ ] Verificar ES/EN, etiquetas VoiceOver, navegación de pestañas y ausencia de desbordes.
- [ ] Comprobar que las páginas de checkout y dominios sin autorización quedan excluidos.
- [ ] Registrar versión de iOS, Safari, Userscripts y URL de prueba sin datos personales.

### Windows — Opera GX / extensión Chromium

- [ ] Cargar la carpeta de extensión descomprimida con modo desarrollador.
- [ ] Repetir apertura, cierre, desplazamiento, cambio de plan, edición manual, idiomas y teclado.
- [ ] Revisar consola del navegador y consola del service worker sin publicar datos de sesión.
- [ ] Confirmar la lista de permisos del manifest y que no requiere wallets ni claves API.
- [ ] Registrar versión de Opera GX y extensión; adjuntar reproducción de cualquier incidencia.

### Criterio de cierre

La fase 7 automatizada solo puede darse por aprobada después del **CI verde del PR específico**. La certificación física requiere evidencia independiente en los equipos indicados. Si hay una incidencia, registrar: navegador, versión, URL de prueba, pasos, esperado, obtenido y una captura **sin credenciales ni pagos**.

## Próxima etapa técnica (fase 8)

Auditar las 1292 líneas de \`src/legacy/runtime.js\` y migrar por responsabilidades, no con conversión masiva. Priorización:

1. Control de posición, arrastre y teclado del FAB a \`src/ui/fab-controller.ts\`.
2. Control de estado de apertura/cierre del panel, preservando \`aria-expanded\` y el cálculo diferido.
3. Adaptador de persistencia y almacenamiento GM, con pruebas para valores asíncronos y callback de gestores anteriores.
4. Módulos de renderizado y comunicación con APIs restantes solo después de regresiones de interfaz.

**Regla de seguridad:** cada extracción debe actualizar los tres artefactos compilados, conservar permisos y claves locales, y aprobar TypeScript strict, Vitest, Playwright multi-motor, privacidad, empaquetado y paridad. No presentar extracciones sin integración verificada como fases completadas.
