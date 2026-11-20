# Moncevia — pendientes antes de la próxima expansión

La v3.4.0 se centra en la interfaz bilingüe, sin ampliar la superficie financiera.

## Prioridad 1 — Validación y exactitud
- Pruebas manuales de cambios ES/EN/Auto en iPhone Safari con Userscripts y persistencia tras recargar.
- Pruebas visuales en sitios distintos de RIFT, sin escanear ni enviar datos antes de autorizar el dominio.
- Revisión de tarifas/precisión: retiros sujetos a moneda+red+cuenta, límites mínimos, fee currency y profundidad real del libro Spot. No presentarlos como automáticos cuando no estén verificados.
- Ampliar pruebas automatizadas de tasas caducadas, fallos de APIs, lectura de separadores, interfaz con VoiceOver y texto grande.

## Prioridad 2 — Arquitectura
- Separar motor de cálculos, acceso a proveedores, parser DOM, almacenamiento y UI para facilitar futuras ampliaciones.
- Revisión de internacionalización: extraer el catálogo de cadenas a módulos y comprobar cadenas no traducidas durante CI.
- Evaluar `@match` más restrictivo o modelos alternativos de activación y permisos por dominio; mantener exclusiones de pagos/banca.

## Prioridad 3 — Distribución
- Decidir una licencia explícita con el propietario del repositorio antes de aceptar contribuciones.
- Añadir tags y releases versionadas cuando se haya aprobado la prueba física de Safari.
- Crear guía de incidencias reproducibles y matriz de versiones Safari/Userscripts.

## Fuera del alcance por ahora
- Obtener comisiones privadas de Binance sin autenticación; nunca solicitar claves en un userscript de páginas de terceros.
- Ejecutar compras, retiros o firmas de transacciones.
- Desarrollar extensiones de alto riesgo antes de definir el alcance de la expansión.
