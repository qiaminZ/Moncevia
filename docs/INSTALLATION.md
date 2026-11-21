## Uso del botón flotante en cualquier dispositivo / Moving the floating launcher

**Móvil:** mantén el dedo sobre **CLP · ₿** y arrástralo hasta el lugar deseado; al soltarlo se guarda la ubicación. Un toque normal abre el panel.

**PC/laptop:** arrástralo con el mouse o usa las flechas del teclado cuando tenga el foco. Mayús + flecha lo mueve más rápido.

**Restablecer:** abre Moncevia → Ajustes / Settings → General y sitio actual / General & current site → Restablecer posición del botón / Reset floating button position. El panel principal mantiene su diseño y ubicación normales.

La posición se guarda en cada navegador por separado, y se reajusta cuando la pantalla cambia de tamaño.

# Moncevia — Installation guide / Guía de instalación

**Versión nativa:** 0.1.4 beta (motor de cálculo compartido con Moncevia Userscript 3.5.4). Descarga únicamente desde el [repositorio oficial](https://github.com/qiaminZ/Moncevia). La extensión aún **no está publicada ni firmada por ninguna tienda**. No incluye software de pago ni solicita claves de Binance.

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
