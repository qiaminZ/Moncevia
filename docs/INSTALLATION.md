## RIFT — comprobación de Safari

**Moncevia v3.15.2** reconoce una tienda aunque su código HTML incluya una **ventana de inicio de sesión cerrada**. Antes se bloqueaba todo el userscript por el simple hecho de existir un campo de contraseña oculto. La protección permanece activa si el formulario de contraseña está visible, y en rutas de login, cuenta, checkout o pago.

En `https://shop.riftbot.org/` el dominio viene permitido inicialmente. En `https://riftbot.mysellauth.com/` y otros dominios nuevos primero debe aparecer **Moncevia · activar aquí**, y solo después del consentimiento persistido se habilitan el botón y las tasas. Si el navegador está mostrando un dominio distinto, revisa el **host exacto** que aparece en la barra de direcciones.

Si Moncevia continúa ausente, utiliza el [userscript de diagnóstico de Safari](../diagnostics/moncevia-rift-diagnostic.user.js) **solo como prueba temporal** en el mismo dominio. Muestra localmente si el gestor inyectó un userscript y el dominio actual; no hace solicitudes ni lee/escribe preferencias. Si tampoco aparece su tarjeta, revisa permisos y carpeta de Userscripts antes de modificar el motor financiero.

## Safari iPhone/iPad — si Moncevia no aparece

1. Comprueba en **Ajustes de iOS → Apps → Safari → Extensiones** que **Userscripts** esté habilitada y tenga permiso para el sitio. En Safari, abre el menú de extensiones, entra en **Userscripts** y verifica que `moncevia.user.js` figure activo; al editar o reemplazar archivos, abre de nuevo su panel para actualizar la lista.
2. Abre la aplicación **Userscripts** y comprueba qué carpeta de Archivos tiene seleccionada. Guarda allí el [archivo completo moncevia.user.js](https://raw.githubusercontent.com/qiaminZ/Moncevia/main/moncevia.user.js) **v3.15.1**, no `moncevia.meta.js` ni un enlace guardado como texto. Evita archivos duplicados o versiones anteriores.
3. Recarga una tienda HTTPS compatible. En sitios nuevos, toca **Moncevia · activar aquí** para autorizarla; en sitios aprobados aparece el botón **CLP · ₿**. Los dominios `.cl`, inicios de sesión, checkout y otras páginas sensibles están excluidos intencionalmente.
4. Si el botón aparece pero no las tasas, comprueba que el gestor permita las solicitudes a los proveedores públicos. No elimines tus datos de Userscripts sin respaldar las preferencias o el historial que quieras conservar.
5. **Actualizaciones:** desde v3.15.1 se publica `moncevia.meta.js` como destino de `@updateURL`, con `moncevia.user.js` como archivo de descarga. Una versión antigua ya instalada puede necesitar **reemplazo manual** para adoptar esta corrección; no presupongas que se actualizará sola.

**Nota:** las pruebas automatizadas sobre WebKit no equivalen a una instalación física de Userscripts en iOS. Para informar un problema, indica versión iOS, versión de Userscripts, dominio de prueba y si no aparece el botón, no abre o faltan tasas.

## Fase 12 — Rendimiento y reanudación

**Versión previa:** userscript **3.15.0** y extensiones beta **0.11.0**. Las ráfagas de cambios en la tienda se agrupan para evitar trabajo redundante y los observadores se reanudan al volver desde el historial del navegador (BFCache). Se conservan claves locales, permisos y fuentes. Actualiza la copia instalada desde `main` una vez que la versión esté publicada.

## Fase 11 — Actualización de interfaz

**Versión de la fase 11:** userscript **3.14.0**; extensiones Chromium/Firefox **0.10.0-beta**. Actualiza desde `main` y recarga el complemento o la página; desactiva copias duplicadas.

## Fase 10 — Recuperación y permisos persistidos

**Versión actual:** userscript **3.13.0** y extensiones de escritorio **0.9.0-beta**. Las preferencias e historial local anteriores se conservan sin intervención. Si el navegador bloquea el almacenamiento, Moncevia no activará un dominio nuevo hasta confirmar que su autorización quedó guardada. Comprueba que el botón de activación desaparezca antes de usar el panel; si aparece un error, revisa los permisos de almacenamiento de Userscripts o del navegador.

**English:** Userscript 3.13.0 and desktop extension 0.9.0-beta retain existing local keys and refuse to activate a new merchant domain when consent cannot be saved. Re-enable the manager's storage permissions and retry.

## Fase 9 — Compatibilidad de gestores de userscripts

**Versión de la fase 9:** userscript **3.12.0** y extensiones nativas **0.8.0-beta**. El adaptador de almacenamiento y solicitudes se modernizó sin modificar los nombres de preferencias locales ni el proceso de autorización. En gestores antiguos con API `GM_*`, conserva la lectura y escritura de preferencias y las peticiones mediante callbacks. Al actualizar el userscript, recarga la página; al actualizar una extensión local, recarga también el complemento en el navegador. No instales simultáneamente la extensión y el userscript en el mismo sitio.

**English:** Userscript 3.12.0 and native extensions 0.8.0-beta keep existing stored data and site permissions while supporting modern `GM.*` and older `GM_*` managers. Reload the script or unpacked extension after updating; disable duplicate installations.

## Fase 6 — Idioma automático y selección manual

Moncevia v3.10.0 conserva el selector Español / English / Auto. El idioma automático sigue la configuración del navegador y los cambios manuales se guardan localmente. Las traducciones se aplican únicamente al panel, mensajes y controles de Moncevia: nunca al contenido de la tienda. Actualiza el userscript o recarga tu extensión local tras instalar los archivos nuevos.

**English:** Auto follows your browser language; explicit ES or EN preferences override it. Moncevia only translates its own panel, messages and accessibility labels. The merchant's website is unaffected.

## Fase 5 — Configuración segura / Typed configuration

Moncevia v3.9.0 verifica los ajustes almacenados y las cotizaciones públicas antes de utilizarlos. Los dominios autorizados y parámetros válidos se conservan, pero las entradas dañadas se descartan; Moncevia no amplía los permisos por una migración. Para la extensión de PC, actualiza el directorio del repositorio y recarga el manifiesto de Chromium/Firefox. Los datos de un proveedor siguen siendo aproximaciones, no importes ejecutables.

**English:** Version 3.9.0 checks saved preferences and public quote payloads before use, without expanding site permissions. Refresh unpacked desktop extensions after updating their files. Quotes are informational, not executable prices.

## Cambios rápidos de plan y entrada manual / Rapid option changes

Al alternar entre planes, Moncevia espera el valor vigente del producto y descarta comprobaciones programadas para variantes anteriores. Si escribes manualmente un precio, se suspenden las sincronizaciones pendientes hasta que vuelvas a seleccionar explícitamente una opción de la página. La moneda representada por un símbolo `$` ambiguo debe seguir confirmándose por sitio. El total del checkout del comercio siempre tiene prioridad.

**English:** Selecting a newer plan cancels older scheduled checks. Typing a manual amount suspends automatic selection until you click a product option again. Ambiguous `$` still requires confirmation; always verify the merchant's checkout total.

## Diseño adaptable / Responsive design

El panel de Moncevia se ajusta al ancho y altura disponibles en celulares, tablets, PC y notebooks. En orientación horizontal utiliza el alto visible para mantener las secciones accesibles. El diseño del comercio no se modifica. El botón flotante sigue siendo arrastrable y puede restablecerse desde Ajustes.

**English:** The panel adapts to phones, tablets and desktop sizes; short landscape screens keep it scrollable. Moncevia does not resize or modify merchant websites. The launcher remains draggable and resettable.

## Si un botón de variante no actualiza el importe / Dynamic storefront synchronization

1. Instala la última versión de Moncevia y recarga la página; evita duplicados del userscript y la extensión nativa.
2. Autoriza el dominio compatible. Cuando `$` no identifica la moneda, confírmala una vez por sitio.
3. Selecciona el plan/talla/producto directamente en la página. Moncevia intenta leer el precio vigente del producto, aun si el botón no contiene un número.
4. Tras los cambios del sitio, comprueba que importe y moneda coincidan con el precio visible. Si muestra `Sincronizando precio seleccionado…`, la tienda puede estar actualizando su contenido.
5. Si no hay información suficientemente clara, utiliza `Seleccionar en web` o introduce el importe manual. No asumas que el precio detectado sustituye el total final del comercio.

**English:** Select the actual variant and check Moncevia against the storefront's displayed total. Dynamic page updates may take a moment; ambiguous symbols require explicit currency confirmation. The checkout amount always takes precedence.

## Uso del botón flotante en cualquier dispositivo / Moving the floating launcher

**Móvil:** mantén el dedo sobre **CLP · ₿** y arrástralo hasta el lugar deseado; al soltarlo se guarda la ubicación. Un toque normal abre el panel.

**PC/laptop:** arrástralo con el mouse o usa las flechas del teclado cuando tenga el foco. Mayús + flecha lo mueve más rápido.

**Restablecer:** abre Moncevia → Ajustes / Settings → General y sitio actual / General & current site → Restablecer posición del botón / Reset floating button position. El panel principal mantiene su diseño y ubicación normales.

La posición se guarda en cada navegador por separado, y se reajusta cuando la pantalla cambia de tamaño.

# Moncevia — Installation guide / Guía de instalación

**Versión nativa:** 0.11.0-beta (motor compartido con Moncevia Userscript 3.15.0). Descarga únicamente desde el [repositorio oficial](https://github.com/qiaminZ/Moncevia). La extensión aún **no está publicada ni firmada por ninguna tienda**. No incluye software de pago ni solicita claves de Binance.

## Elige tu dispositivo y navegador

| Dispositivo | Navegador | Método | Estado |
|---|---|---|---|
| PC / laptop (Windows, macOS, Linux) | Chrome | Extensión nativa Chromium | Beta para probar |
| PC / laptop | Edge | Extensión nativa Chromium | Beta para probar |
| PC / laptop | Opera, Opera GX | Extensión nativa Chromium | Beta para probar |
| PC / laptop | Brave, Vivaldi | Extensión nativa Chromium | Beta para probar |
| PC / laptop | Firefox | Extensión Firefox temporal o userscript | Firma pendiente para instalación permanente |
| Android | Firefox | Userscript con gestor compatible | Disponible |
| Android | Chrome oficial | No admite extensión de escritorio | No disponible |
| iPhone / iPad | Safari | Userscripts para Safari | Disponible |

**Nota:** el funcionamiento real puede variar según la versión y políticas del navegador. La extensión nativa no se ha enviado a Chrome Web Store, Microsoft Edge Add-ons ni Mozilla Add-ons.

## Windows / macOS / Linux: Chrome, Edge, Opera, Brave, Vivaldi

1. En [GitHub](https://github.com/qiaminZ/Moncevia), selecciona **Code → Download ZIP**. Descomprime el archivo en una carpeta que **no moverás** después.
2. Abre la dirección de extensiones del navegador: `chrome://extensions`, `edge://extensions`, `opera://extensions`, `brave://extensions` o `vivaldi://extensions`.
3. Activa **Modo desarrollador / Developer mode**.
4. Selecciona **Cargar descomprimida / Load unpacked**.
5. Elige la carpeta **`extension/chromium`**, que contiene `manifest.json`. *No* selecciones el ZIP ni la carpeta raíz del repositorio.
6. Visita `https://shop.riftbot.org` o una tienda HTTPS compatible. En sitios nuevos, pulsa **«Moncevia · activar aquí»** para autorizarlos. Luego utiliza el botón flotante para convertir precios.
7. Si usabas un gestor con el userscript, desactiva su copia de Moncevia para evitar dos paneles.

**Actualización manual:** descarga una nueva versión, reemplaza el contenido de la carpeta manteniendo la misma ruta y pulsa **Recargar / Reload** en la pantalla de extensiones. No hay actualización automática de estas copias sin publicar en tiendas.

## Firefox en PC / laptop

La extensión nativa para Firefox está empaquetada en **`extension/firefox`** y utiliza un mecanismo en segundo plano distinto al de Chromium.

**Prueba temporal:** abre `about:debugging` → **This Firefox / Este Firefox** → **Load Temporary Add-on / Cargar complemento temporal** → selecciona `extension/firefox/manifest.json`. Este complemento desaparece al reiniciar Firefox. Para distribución permanente Mozilla exige **firmar** la extensión; esa firma todavía no existe.

**Uso diario recomendado por ahora:** instala **Violentmonkey** o **Tampermonkey** desde el catálogo oficial de complementos de Firefox e importa [`moncevia.user.js`](https://raw.githubusercontent.com/qiaminZ/Moncevia/main/moncevia.user.js). Desactiva cualquier copia anterior.

## Android

**Firefox para Android:** instala Firefox y un gestor de userscripts disponible en los complementos de Firefox. Copia o instala el archivo [`moncevia.user.js`](https://raw.githubusercontent.com/qiaminZ/Moncevia/main/moncevia.user.js). Autoriza cada web compatible y recarga la pestaña. No necesitas la extensión nativa de PC.

**Chrome para Android:** la edición oficial no ejecuta extensiones de escritorio. Usa Firefox con un gestor compatible en lugar de instalar versiones modificadas de Chrome de procedencia dudosa.

## iPhone y iPad

Instala **Userscripts** para Safari desde App Store, activa la extensión en Configuración de Safari, guarda [`moncevia.user.js`](https://raw.githubusercontent.com/qiaminZ/Moncevia/main/moncevia.user.js) en la carpeta configurada para Userscripts y recarga el sitio. No uses los paquetes nativos de PC en iOS.

## Primera configuración y privacidad

- Moncevia requiere acceso a páginas HTTPS para mostrar el botón de autorización; la conversión y las cotizaciones se activan por sitio. No lo autorices en cuentas bancarias, billeteras ni páginas de inicio de sesión o pago.
- El permiso de almacenamiento guarda ajustes e historial **localmente en cada navegador**. Las preferencias del userscript y de la extensión nativa **no se transfieren automáticamente**.
- Las peticiones de tipos de cambio se limitan a proveedores públicos de monedas y criptomonedas. Estos proveedores pueden ver datos normales de conexión (como IP).
- **Nunca introduzcas frases semilla, contraseñas ni claves API en Moncevia.** No envía criptomonedas ni compra activos: calcula estimaciones. Verifica red, importe exacto y comisión real antes de pagar.

## Solución de problemas

- **No aparece el botón:** comprueba que Moncevia esté activa, que el sitio sea HTTPS y que no estés en una página excluida. Recarga.
- **Duplicado:** desactiva la versión del userscript si utilizas la extensión nativa.
- **Sin cotizaciones:** revisa conexión, permisos de extensión y posible bloqueo de proveedores. No utilices una tasa obsoleta para pagar.
- **Se perdieron ajustes:** confirma que no cambiaste la ruta de la extensión descomprimida o el perfil del navegador. Los gestores y extensiones almacenan datos por separado.
- **El navegador impide instalar:** dispositivos administrados por una organización pueden bloquear extensiones de desarrollo. No desactives políticas de seguridad para sortear esas restricciones.
- **Firefox elimina el complemento al reiniciar:** es normal con un complemento temporal sin firma. Utiliza el userscript mientras se gestiona la publicación oficial.

## English quick start

- **Chrome / Edge / Opera / Brave / Vivaldi desktop:** download the GitHub repository ZIP, extract it, open your browser's Extensions page, enable Developer mode and **Load unpacked** from the `extension/chromium` folder.
- **Firefox desktop:** for temporary testing, load `extension/firefox/manifest.json` via `about:debugging`; permanent installation requires Mozilla signing. The userscript plus a compatible manager remains the everyday option.
- **Firefox Android:** install a userscript manager and import `moncevia.user.js`.
- **Safari iOS / iPadOS:** install the Userscripts Safari extension and save `moncevia.user.js` into its configured scripts folder.
- **Official Android Chrome:** desktop-style extensions are unsupported.
- Authorize only trusted shopping sites, never submit secrets, and check the final payment details independently.
