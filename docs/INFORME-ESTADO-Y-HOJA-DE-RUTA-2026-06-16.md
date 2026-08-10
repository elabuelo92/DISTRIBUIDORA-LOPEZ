# Informe de estado y hoja de ruta - 2026-06-16

Proyecto: Distribuidora Lopez - Sistema de preventa, stock y administracion.

Objetivo del documento: dejar una navegacion clara de lo realizado desde el inicio hasta la fecha, con banderas de hitos para poder volver a un punto concreto, auditar decisiones y modificar sin mezclar versiones viejas.

## Estado operativo vigente

Carpeta operativa real:

```text
C:\DLPreventaServer
```

Paquete limpio de distribucion:

```text
C:\DistribuidoraLopez\SERVIDOR_UNICO_8790
```

ZIP vigente:

```text
C:\DistribuidoraLopez\release\DLPreventaServer-UNICO-8790-2026-06-17.zip
```

Servidor vigente:

```text
Puerto: 8790
Instancia: SERVIDOR_UNICO_8790
Bind red: 0.0.0.0
Estado: C:\DLPreventaServer\data\demo-state.json
Usuarios: C:\DLPreventaServer\data\users.json
Version frontend: 8790-18
```

URL local en la PC servidor:

```text
http://127.0.0.1:8790/index.html#dashboard
http://127.0.0.1:8790/index.html#preventa
http://127.0.0.1:8790/api/health
```

URL prioritaria para celular por Tailscale, solo para carga y sincronizacion:

```text
http://desktop-c2c0q4v:8790/index.html#preventa
http://desktop-c2c0q4v:8790/api/health
http://desktop-c2c0q4v.tail6f19de.ts.net:8790/index.html#preventa
http://desktop-c2c0q4v.tail6f19de.ts.net:8790/api/health
```

URL requerida para GPS real desde Chrome Android, cuando Tailscale Serve HTTPS quede activo:

```text
https://desktop-c2c0q4v.tail6f19de.ts.net/index.html#preventa
https://desktop-c2c0q4v.tail6f19de.ts.net/api/health
```

Datos validados al 2026-06-16:

- Productos cargados: 644.
- Clientes cargados: 756.
- Pedidos registrados: 18.
- Ultimo pedido detectado: PED-2069.
- Estado recuperado desde Chrome Local Storage y consolidado en `demo-state.json`.
- Preventa movil con seleccion desplegable de clientes y productos.
- Carga rapida de cliente desde preventa.
- Descuento de stock contra archivo central.
- Modulo inicial de estadisticas operativo.

## Advertencias vigentes

- No usar puerto 8789.
- No usar IPs antiguas ni APKs apuntadas a `192.168.88.3`.
- No usar `100.116.67.7` como URL principal para el celular.
- Tailscale Serve puede devolver 404 por IP directa; usar siempre nombre `desktop-c2c0q4v` o `desktop-c2c0q4v.tail6f19de.ts.net`.
- No correr index, cmd o servidores sueltos de compilaciones anteriores.
- La unica carpeta operativa para correr el sistema es `C:\DLPreventaServer`.
- `C:\DistribuidoraLopez\SERVIDOR_UNICO_8790` queda como paquete limpio para distribucion/reinstalacion.
- Chrome Android no entrega GPS real desde una URL HTTP remota. Para GPS usar HTTPS por Tailscale o APK.

## Banderas de hitos

### BANDERA 01 - Relevamiento inicial y demo operativa

Fecha: 2026-06-15.

Se definio una demo funcional para ordenar preventa, stock, clientes, pedidos, cuentas y administracion.

Archivos/documentos relacionados:

- `docs\RELEVAMIENTO-OPERATIVO.md`
- `docs\SEMANA-1.md`
- `docs\PLAN-30-DIAS-AJUSTADO.md`

Estado: base conceptual completada.

Riesgo: los primeros documentos contienen referencias de prueba que no deben tomarse como instalacion vigente.

### BANDERA 02 - Paquete inicial para PC / mini PC

Fecha: 2026-06-15.

Se genero un paquete inicial para instalar el sistema en Windows y probar una mini PC con IP fija.

Archivos/documentos relacionados:

- `docs\PASO-A-PASO-PC-Y-MINI-PC.md`
- `docs\MINI-PC-192-168-88-3.md`
- `release\DistribuidoraLopez-Semana1-2026-06-15.zip`

Estado: desestimado como referencia principal.

Riesgo: quedaban URLs, IPs y APKs de prueba que confundian la sincronizacion.

### BANDERA 03 - Diagnostico de sincronizacion y puertos

Fecha: 2026-06-16.

Se detecto que habia procesos Node y servidores viejos ocupando puertos o sirviendo carpetas distintas. Eso provocaba que la PC viera una informacion y el celular otra.

Decision tomada:

- Unificar en un solo servidor.
- Usar solo puerto 8790.
- Evitar carpetas operativas mezcladas.

Archivos/documentos relacionados:

- `docs\SERVIDOR-UNICO-8790.md`
- `DETENER-SERVIDORES-8789-8790.cmd`
- `INICIAR-SERVIDOR-UNICO-8790.cmd`
- `VERIFICAR-SERVIDOR-8790.cmd`

Estado: completado.

Punto de retorno: si vuelve a fallar sincronizacion, primero verificar `/api/health` y que `root` sea `C:\DLPreventaServer`.

### BANDERA 04 - Instalacion limpia vigente

Fecha: 2026-06-16.

Se establecio `C:\DLPreventaServer` como carpeta operativa real y se preparo `SERVIDOR_UNICO_8790` como paquete limpio.

Archivos relacionados:

- `C:\DLPreventaServer\server.js`
- `C:\DLPreventaServer\data\demo-state.json`
- `C:\DistribuidoraLopez\SERVIDOR_UNICO_8790`

Estado: vigente.

Regla: las pruebas operativas deben hacerse contra esta instalacion y este puerto.

### BANDERA 05 - Tailscale y acceso remoto

Fecha: 2026-06-16.

Se definio acceso del celular por Tailscale hacia el servidor local.

Arquitectura vigente:

```text
Node escucha en 127.0.0.1:8790
Tailscale publica hacia el celular
```

URL de trabajo:

```text
http://desktop-c2c0q4v:8790/index.html#preventa
```

Esta URL HTTP sirve para navegar y sincronizar, pero no para GPS real en Chrome Android.

Validacion:

```text
http://desktop-c2c0q4v:8790/api/health
```

Estado: configuracion base definida.

Riesgo: si el celular no resuelve el nombre, revisar que el celular este conectado a Tailscale, que Tailscale Serve este activo y que Windows Firewall permita el puerto 8790.

Nota: Node no debe competir con Tailscale en la IP `100.x`. Por eso el servidor escucha localmente en `127.0.0.1` y Tailscale hace de puente.

### BANDERA 06 - Normalizacion de Excel / CSV

Fecha: 2026-06-16.

Se analizaron los Excel originales de clientes y mercaderia y se generaron CSV normalizados.

Archivos generados:

- `importaciones\fase2\clientes_normalizados.csv`
- `importaciones\fase2\productos_stock_normalizados.csv`
- `importaciones\fase2\productos_con_stock_inicial.csv`
- `importaciones\fase2\stock_inicial_para_importar.csv`
- `importaciones\fase2\familias_articulos.csv`
- `importaciones\fase2\resumen_importacion.json`

Documento relacionado:

- `docs\ANALISIS-EXCEL-CLIENTES-MERCADERIA.md`

Estado: completado.

Pendiente futuro: lector de codigo de barras para ingreso, despacho e inventario.

### BANDERA 07 - Front normalizado para clientes y stock

Fecha: 2026-06-16.

Se adapto el frontend para que las altas manuales respeten los campos normalizados.

Clientes:

- codigo_cliente
- nombre_comercial
- razon_social
- cuit
- condicion_fiscal
- domicilio
- localidad
- telefono
- tipo_cliente
- zona
- ruta
- vendedor_asignado
- forma_pago
- dias_credito
- limite_credito
- saldo_inicial
- dia_visita
- frecuencia_visita
- estado
- observaciones

Productos/stock:

- codigo_producto
- codigo_barras
- descripcion
- rubro
- marca
- familia
- segmento
- stock_actual
- stock_minimo
- bultos
- costo
- precio_lista_1 a precio_lista_5
- iva
- bonificacion
- activo

Documento relacionado:

- `docs\FRONT-CARGA-CLIENTES-STOCK-NORMALIZADO.md`

Estado: completado.

### BANDERA 08 - Modulo inicial de estadisticas

Fecha: 2026-06-16.

Se agrego una vista `Estadisticas` con lectura grafica inicial para consumo, tendencias, ventas, ingresos vs egresos y reposicion.

Documento relacionado:

- `docs\MODULO-ESTADISTICAS-OPERATIVAS.md`

Estado: primera version funcional.

Pendiente: crear lineas de pedido normalizadas para estadistica mas precisa.

### BANDERA 09 - GPS y cierre de ventanas

Fecha: 2026-06-16.

Se corrigio el cierre de modales para que los botones `X` y `Cancelar` cierren sin depender de la tecla Escape.

Tambien se reviso GPS y mapas. En una version intermedia se habia desactivado Google Maps por defecto para evitar el error de API. Esa decision queda reemplazada por la bandera 11.

Documento relacionado:

- `docs\AJUSTE-GPS-Y-CIERRE-VENTANAS-2026-06-16.md`

Estado: cierre de ventanas corregido; mapa reemplazado por Google real en bandera 11.

### BANDERA 10 - Preventa movil con clientes y productos desplegables

Fecha: 2026-06-16.

Se adapto la preventa movil para trabajar con datos cargados desde CSV:

- Selector desplegable de clientes cargados.
- Boton/formulario de carga rapida de cliente.
- Selector desplegable de productos cargados.
- Cantidad y boton `Agregar`.
- Carrito que muestra solo productos seleccionados.

Estado: completado en frontend `8790-6` y continuado en `8790-7`.

Punto de control: si el celular no muestra estos controles, limpiar cache o abrir `ABRIR-LIMPIAR-NAVEGADOR.cmd`.

### BANDERA 11 - Google Maps real reactivado

Fecha: 2026-06-16.

Se reactivo Google Maps real y se elimino la caida silenciosa al mapa interno.

Archivos modificados:

- `index.html`
- `app.js`
- `styles.css`
- `sw.js`
- `config.js`
- `maps-config.js`
- `server.js`

Version frontend:

```text
8790-7
```

Comportamiento nuevo:

- Si Google Maps carga correctamente, se muestra el mapa vivo de Google.
- Si Google Maps rechaza la clave, falla la facturacion, falla la restriccion de dominio o no hay conexion, el sistema muestra un error visible.
- Ya no se muestra el mapa interno como reemplazo silencioso cuando Google Maps esta solicitado.

Riesgo vigente:

Google Maps depende de que la clave tenga habilitado:

- Maps JavaScript API.
- Facturacion activa en Google Cloud.
- Restricciones de dominio que permitan las URLs usadas por el sistema.

Dominios/URLs a permitir en Google Cloud si la clave tiene restricciones:

```text
http://127.0.0.1:8790/*
http://localhost:8790/*
http://desktop-c2c0q4v:8790/*
http://desktop-c2c0q4v.tail6f19de.ts.net:8790/*
```

### BANDERA 12 - Buscadores moviles para clientes y productos

Fecha: 2026-06-16.

Se proceso el video recibido por WhatsApp y se detecto que el selector nativo de Android quedaba inmanejable con cientos de clientes cargados.

Correccion:

- Se reemplazo el selector nativo grande por buscador propio de clientes.
- Se reemplazo el selector nativo grande por buscador propio de productos.
- Se ocultaron los select internos para que Android no abra la pantalla oscura de seleccion.
- Se mantuvo compatibilidad con el estado actual del pedido.
- Se subio el frontend a version `8790-8`.

Documento relacionado:

- `docs\AJUSTE-BUSCADORES-MOVILES-2026-06-16.md`

### BANDERA 13 - GPS real en Android: HTTPS, permisos y limpieza demo

Fecha: 2026-06-16.

Se recibio captura del telefono con el error:

```text
Only secure origins are allowed
```

Diagnostico:

- El telefono estaba entrando por `http://desktop-c2c0q4v:8790`.
- Chrome Android bloquea `navigator.geolocation` cuando la pagina no usa HTTPS.
- Activar permisos de ubicacion en Android es necesario, pero no alcanza si la URL sigue siendo HTTP.
- Las coordenadas de Buenos Aires venian de una ubicacion demo/simulada guardada de una prueba anterior.

Correccion:

- Se subio el frontend a version `8790-9`.
- El boton de ubicacion simulada ahora dice `Demo Cordoba`.
- La ubicacion demo por defecto se movio a Cordoba.
- La app muestra mensaje claro cuando GPS queda bloqueado por HTTP.
- El estado central quedo sin coordenadas demo guardadas.
- Se sincronizo el paquete `SERVIDOR_UNICO_8790` con el servidor activo.

Documento relacionado:

- `docs\AJUSTE-GPS-HTTPS-PERMISOS-2026-06-16.md`

URL HTTP valida solo para carga/sincronizacion:

```text
http://desktop-c2c0q4v:8790/index.html#preventa
```

URL HTTPS requerida para GPS real desde navegador:

```text
https://desktop-c2c0q4v.tail6f19de.ts.net/index.html#preventa
```

Comando recomendado para publicar HTTPS por Tailscale:

```powershell
tailscale serve --bg --yes --https=443 http://127.0.0.1:8790
```

Estado verificado al cierre de esta bandera:

```text
Tailscale Serve sigue en HTTP:
http://desktop-c2c0q4v:8790
http://desktop-c2c0q4v.tail6f19de.ts.net:8790
```

Se intento activar HTTPS desde Codex, pero la CLI de Tailscale no respondio y el comando se corto por tiempo. Queda pendiente ejecutar el comando en PowerShell administrador y revisar MagicDNS/HTTPS/certificados en el panel de Tailscale si vuelve a colgar.

Permisos a revisar en el telefono:

- Ubicacion general de Android activa.
- Chrome con permiso de ubicacion.
- Ubicacion precisa activa si Android la ofrece.
- Configuracion del sitio en Chrome con ubicacion permitida.

Punto de control: si vuelve a aparecer Buenos Aires, limpiar cache/localStorage del navegador y confirmar que no se haya tocado `Demo Cordoba`.

### BANDERA 14 - APK Android con GPS nativo

Fecha: 2026-06-16.

Se creo una APK nueva desde fuente Android limpia usando el Android SDK instalado en la PC.

Objetivo:

- Evitar la limitacion de Chrome Android sobre GPS en HTTP remoto.
- Cargar la preventa desde el servidor vigente.
- Pedir permisos nativos de Android.
- Enviar coordenadas reales al frontend por puente JavaScript.

APK generada:

```text
C:\DistribuidoraLopez\SERVIDOR_UNICO_8790\android-apk\out\DL-Preventa-GPS-NATIVO-8790.apk
C:\DistribuidoraLopez\release\DL-Preventa-GPS-NATIVO-8790.apk
```

Package Android:

```text
com.distribuidora.lopez.gps
```

Version:

```text
2.0-gps
```

URL primaria embebida:

```text
http://desktop-c2c0q4v:8790/index.html#preventa
```

URL fallback:

```text
http://100.116.67.7:8790/index.html#preventa
```

Permisos incluidos:

- `android.permission.INTERNET`
- `android.permission.ACCESS_NETWORK_STATE`
- `android.permission.ACCESS_FINE_LOCATION`
- `android.permission.ACCESS_COARSE_LOCATION`

Firma:

```text
Verificada con apksigner: v1, v2 y v3 OK.
```

Hash SHA256:

```text
783130C8DA290760F7006CCC373B0D6DC6636E9A59422E2FB76EF96FC94B6739
```

Documentos relacionados:

- `docs\APK-GPS-NATIVO-ANDROID-2026-06-16.md`
- `docs\INSTALACION-APK-GPS-NATIVO-8790.md`

Punto de control: la app se llama `DL Preventa GPS` y se instala separada de la APK anterior para evitar conflicto de firma.

### BANDERA 15 - Proteccion contra reseteo de estado por cache vieja

Fecha: 2026-06-16.

Durante la verificacion posterior a la APK, el servidor activo quedo momentaneamente con el seed viejo:

- 5 productos.
- 5 clientes.
- 4 pedidos.

El paquete limpio conservaba el estado correcto:

- 644 productos.
- 756 clientes.
- 18 pedidos.

Correccion aplicada:

- Se deshabilito el boton `Reiniciar demo` para la operacion diaria.
- El servidor ahora rechaza un POST de estado que reduzca masivamente clientes, productos o pedidos.
- Se evita que una pestana vieja/cache/localStorage vuelva a pisar el estado normalizado.

Punto de control: si el servidor reporta menos de 100 productos/clientes, revisar `data\demo-state.json` antes de seguir probando.

## Validacion rapida antes de cada prueba

1. Abrir en la PC:

```text
http://127.0.0.1:8790/api/health
```

2. Confirmar:

```text
instance: SERVIDOR_UNICO_8790
port: 8790
root: C:\DLPreventaServer
latestOrder: PED-2069 o superior
```

3. Abrir dashboard:

```text
http://127.0.0.1:8790/index.html#dashboard
```

4. Abrir preventa:

```text
http://127.0.0.1:8790/index.html#preventa
```

5. En celular por Tailscale:

```text
http://desktop-c2c0q4v:8790/api/health
http://desktop-c2c0q4v:8790/index.html#preventa
```

6. En celular con GPS real, despues de activar HTTPS por Tailscale:

```text
https://desktop-c2c0q4v.tail6f19de.ts.net/api/health
https://desktop-c2c0q4v.tail6f19de.ts.net/index.html#preventa
```

## Checklist de cache

Si la pantalla muestra formularios viejos o no aparecen los desplegables nuevos:

1. En PC: presionar `Ctrl + F5`.
2. Ejecutar `C:\DLPreventaServer\ABRIR-LIMPIAR-NAVEGADOR.cmd`.
3. Cerrar todas las pestanas viejas del sistema.
4. Volver a abrir `http://127.0.0.1:8790/index.html#preventa`.
5. En celular: borrar cache del navegador o abrir en modo incognito.
6. Si aparece una ubicacion vieja de Buenos Aires, borrar datos del sitio y no usar `Demo Cordoba` salvo prueba controlada.

## Backlog marcado para despues

- Recompilar APK solo cuando cambie la URL final del servidor.
- Reemplazar demo-state por base SQLite o similar cuando el piloto confirme el flujo.
- Lector de codigo de barras para ingreso de mercaderia.
- Lector de codigo de barras para despacho.
- Inventario fisico semanal con lector.
- Lineas de pedido normalizadas.
- Estadisticas avanzadas de reposicion, rotacion, cobertura y margen.
- Usuarios/roles finales por vendedor y deposito.
- Backups automaticos verificados fuera de la PC.

## Regla de oro desde este punto

Antes de tocar codigo o datos, ubicar la bandera correspondiente.

Si el problema es conexion, volver a BANDERA 03, 04 o 05.
Si el problema es datos, volver a BANDERA 06 o 07.
Si el problema es preventa movil, volver a BANDERA 10.
Si el problema es GPS/Google Maps, volver a BANDERA 11.
Si el problema es seleccion de clientes/productos en celular, volver a BANDERA 12.
Si el problema es GPS bloqueado en Android o HTTP/HTTPS, volver a BANDERA 13.
Si el problema es APK/GPS nativo, volver a BANDERA 14.
Si el problema es experiencia movil, solapes Android, soporte o hoja de ruta diaria, volver a BANDERA 16.
Si el problema es login, cache, recupero de clave o Tailscale 404 por IP directa, volver a BANDERA 17.
Si el problema es administracion de stock, graficos, exportacion, impresion o edicion protegida de productos, volver a BANDERA 18.
Si el problema es impresion directa, impresora fisica/de red o WhatsApp soporte, volver a BANDERA 19.
Si el problema es notificaciones de pedidos, trazabilidad, urgencias, despacho o entrega, volver a BANDERA 20.
Si el problema es tablero grafico de pedidos o alertas criticas, volver a BANDERA 21.
Si el problema es cortes PDF por estado de pedido o numeros del pipeline, volver a BANDERA 22.
Si el problema es instalacion o ejecucion en MacBook Air, volver a BANDERA 23.

### BANDERA 16 - 2026-06-17 Fase de modificacion UX movil

Fecha: 2026-06-17.

Estado de fase:

```text
Se mantiene fase de modificacion.
No se avanza todavia a fase nueva.
```

Se trabajaron problemas detectados durante prueba real en celular:

- Sesion visible en movil.
- Cierre de sesion mas accesible.
- Acceso a soporte WhatsApp.
- Correccion de solape con barra superior e inferior Android.
- GPS obligatorio al iniciar sesion/app.
- Eliminacion del boton visible `Demo Cordoba`.
- Indicador visual de GPS encendido.
- Base de hoja de ruta diaria.
- Boton `Abrir Maps` hacia cliente seleccionado.
- Objetivos diarios y recompensa inicial.
- Asistente flotante animado.

Version frontend:

```text
8790-11
```

APK recompilada:

```text
C:\DistribuidoraLopez\release\DL-Preventa-GPS-NATIVO-8790.apk
```

SHA256 APK:

```text
9F597BB2FCEAD406BB9CA2FA0688060A73E1757D7F60C650ADC136FA52AFB824
```

Documento relacionado:

- `docs\FASE-MODIFICACION-UX-MOVIL-2026-06-17.md`

### BANDERA 17 - 2026-06-17 Ajuste login, recupero de clave y Tailscale

Fecha: 2026-06-17.

Estado de fase:

```text
Se mantiene fase de modificacion.
No se avanza todavia a fase nueva.
```

Problemas trabajados:

- APK y navegador podian mostrar `No se pudo conectar con el servidor` con credenciales correctas.
- La pantalla podia quedar cargada desde cache aunque la API estuviera sin responder.
- `http://100.116.67.7:8790` devolvia `404 page not found` por Tailscale Serve.
- Faltaba recupero de clave desde la pantalla de ingreso.

Acciones:

- Servidor activo cambiado a `0.0.0.0:8790`.
- Login ahora verifica `/api/health` y reintenta antes de fallar.
- Service worker subido a `v12` y ya no sirve login viejo si no hay servidor.
- APK WebView sin cache.
- Fallback APK corregido a `desktop-c2c0q4v.tail6f19de.ts.net:8790`.
- Recupero de clave agregado en el ingreso.

Version frontend:

```text
8790-12
```

SHA256 APK:

```text
08C91A46436ECB1A8C81DAE0093456A3983C8AD99A2C85995071E6D66BFD345B
```

Documentos relacionados:

- `docs\AJUSTE-LOGIN-RECUPERO-CLAVE-2026-06-17.md`
- `docs\FASE-MODIFICACION-UX-MOVIL-2026-06-17.md`

### BANDERA 18 - 2026-06-17 Modulo Stock administrador

Fecha: 2026-06-17.

Estado de fase:

```text
Se mantiene fase de modificacion.
No se avanza todavia a fase nueva.
```

Problemas/objetivos trabajados:

- Stock no debia ser solo tabla; necesitaba graficos como primera lectura.
- Administracion necesitaba buscador con despliegue de productos.
- Administracion necesitaba exportar CSV/PDF e imprimir.
- La modificacion de productos cargados debia pedir nuevamente clave admin.

Acciones:

- Frontend subido a `8790-13`.
- Panel de stock con KPIs y graficos.
- Buscador propio de productos con desplegable.
- Filtro por estado de stock.
- Exportacion CSV.
- Exportacion PDF.
- Impresion de reporte de stock.
- Edicion de producto con revalidacion admin contra `/api/admin/reauth`.

Documento relacionado:

- `docs\AJUSTE-MODULO-STOCK-ADMIN-2026-06-17.md`

### BANDERA 19 - 2026-06-17 Impresion directa y WhatsApp soporte

Fecha: 2026-06-17.

Estado de fase:

```text
Se mantiene fase de modificacion.
No se avanza todavia a fase nueva.
```

Problemas/objetivos trabajados:

- El boton `Imprimir` de Stock debia enviar directo a la impresora conectada al servidor.
- La impresion debia quedar limitada a administradores.
- El soporte por WhatsApp debia quedar configurado con el numero real `3512410535`.
- Se necesitaba evitar que Windows imprima por error en PDF, OneNote, XPS, Fax, AnyDesk o impresoras redirigidas.

Acciones:

- Frontend subido a `8790-14`.
- WhatsApp configurado como `5493512410535`.
- Nuevo endpoint admin `/api/admin/print-stock`.
- Generacion de reporte TXT en `data\print-jobs`.
- Script de impresion directa `scripts\print-stock-report.ps1`.
- Variable opcional `DL_STOCK_PRINTER_NAME` para fijar impresora exacta.
- Rechazo controlado de impresoras virtuales o redirigidas.

Estado detectado:

```text
No hay impresora fisica/de red visible para Windows en esta PC.
La predeterminada actual es Microsoft Print to PDF (1 redireccionado).
```

Pendiente operativo:

- Instalar la impresora real en Windows.
- Dejarla como predeterminada o configurar `DL_STOCK_PRINTER_NAME`.
- Reiniciar servidor 8790.
- Probar impresion real desde Stock con usuario administrador.

Documento relacionado:

- `docs\AJUSTE-IMPRESION-DIRECTA-WHATSAPP-2026-06-17.md`

### BANDERA 20 - 2026-06-17 Notificaciones y trazabilidad de pedidos

Fecha: 2026-06-17.

Estado de fase:

```text
Se mantiene fase de modificacion.
No se avanza todavia a fase nueva.
```

Problemas/objetivos trabajados:

- Los administradores necesitaban un aviso emergente cuando ingresa un pedido desde celular.
- El modulo Pedidos necesitaba mostrar trazabilidad operativa.
- Administracion necesitaba detectar demoras y urgencias.
- Se necesitaba ver el proceso de despacho y entrega.

Acciones:

- Frontend subido a `8790-15`.
- Pedidos moviles identificados con `source=mobile` y `origin=preventa`.
- Avisos emergentes en administracion para pedidos nuevos de preventa movil.
- Resaltado directo del pedido al tocar `Ver pedido`.
- Trazabilidad por pedido con eventos y hora.
- Flujo operativo `Recibido -> En armado -> Listo reparto -> En reparto -> Entregado`.
- Calculo de demora por etapa.
- Marca manual de urgencia.
- Panel lateral de Pedidos con activos priorizados y trazabilidad.

Documento relacionado:

- `docs\AJUSTE-NOTIFICACIONES-TRAZABILIDAD-PEDIDOS-2026-06-17.md`

### BANDERA 21 - 2026-06-17 Tablero pipeline y alertas criticas

Fecha: 2026-06-17.

Estado de fase:

```text
Se mantiene fase de modificacion.
No se avanza todavia a fase nueva.
```

Problemas/objetivos trabajados:

- El tablero necesitaba mostrar graficamente cuantos pedidos estan ingresados, armados, en despacho, en reparto y entregados.
- Las alertas del costado derecho no debian mostrar una lista larga.
- Administracion necesitaba ver solo las 4 alertas de maxima urgencia.

Acciones:

- Frontend subido a `8790-16`.
- `Flujo del dia` convertido en pipeline grafico de pedidos.
- Conteo por etapa:
  - Ingresados.
  - Armado.
  - Despacho.
  - Reparto.
  - Entregado.
- Barras proporcionales por etapa.
- Resumen de pedidos activos, totales y porcentaje entregado.
- Alertas operativas ordenadas por gravedad y limitadas a 4.

Documento relacionado:

- `docs\AJUSTE-TABLERO-PIPELINE-ALERTAS-2026-06-17.md`

### BANDERA 22 - 2026-06-17 Cortes PDF por estado de pedido

Fecha: 2026-06-17.

Estado de fase:

```text
Se mantiene fase de modificacion.
No se avanza todavia a fase nueva.
```

Problemas/objetivos trabajados:

- Los numeros de las tarjetas del pipeline estaban descentrados visualmente.
- Cada etapa del pipeline debia emitir un PDF con el corte de pedidos correspondiente.

Acciones:

- Frontend subido a `8790-17`.
- Contadores centrados en caja fija.
- Tarjetas de pipeline convertidas en accion clickeable.
- Generacion de PDF por etapa:
  - Ingresados.
  - Armado.
  - Despacho.
  - Reparto.
  - Entregado.
- PDF con cantidad, importe total, detalle de pedidos, demora, prioridad y productos.

Documento relacionado:

- `docs\AJUSTE-CORTES-PDF-PEDIDOS-2026-06-17.md`

### BANDERA 23 - 2026-06-18 MacBook Air como servidor

Fecha: 2026-06-18.

Estado de fase:

```text
Se mantiene fase de modificacion.
No se avanza todavia a fase nueva.
```

Problemas/objetivos trabajados:

- Se definio que la aplicacion debe poder correr sobre una MacBook Air.
- El servidor no debe depender exclusivamente de scripts Windows.
- La impresion directa debe ser compatible con macOS.
- La app debe quedar preparada para Safari/iPhone como web app.

Acciones:

- Frontend subido a `8790-18`.
- `server.js` ahora respeta `DATA_DIR`, `STATE_FILE` y `USERS_FILE` por variables de entorno.
- Impresion directa compatible:
  - Windows: PowerShell / `print-stock-report.ps1`.
  - macOS/Linux: `lp` / CUPS.
- Scripts macOS agregados:
  - `scripts/run-server-macos.sh`
  - `scripts/check-macos.sh`
  - `scripts/install-launchagent-macos.sh`
  - `scripts/uninstall-launchagent-macos.sh`
  - `ABRIR-DASHBOARD-MAC.command`
- Metadatos Safari/iPhone agregados:
  - `apple-mobile-web-app-capable`
  - `apple-mobile-web-app-title`
  - `apple-touch-icon`

Decision operativa:

```text
Para MacBook Air no hace falta compilar una app iOS nativa.
La Mac puede correr el servidor Node y los iPhone pueden ingresar por Safari/PWA.
Para GPS real en iPhone se necesita URL HTTPS.
```

Documento relacionado:

- `docs\INSTALACION-MACBOOK-AIR.md`

### BANDERA 24 - 2026-06-23 Ciclo de pedidos y abastecimiento

Fecha: 2026-06-23.

Estado de fase:

```text
Se mantiene fase de modificacion e integracion operativa.
```

Acciones:

- Frontend subido a `8790-19`.
- Estados nuevos: Preventa, Pendiente de abastecimiento, Completo para armado, Armado, Despachado y Entregado.
- Stock separado en fisico, reservado, disponible y en transito.
- Faltantes agrupados por producto y pedido.
- Asignacion automatica por urgencia y FIFO al ingresar mercaderia.
- Descuento fisico recien al despachar.
- Cancelacion administrativa con liberacion y reasignacion de reservas.
- Pedidos historicos migrados sin doble descuento.
- Endpoints operativos y control contra escrituras antiguas.

Documento relacionado:

- `docs\AJUSTE-CICLO-PEDIDOS-ABASTECIMIENTO-2026-06-23.md`

### BANDERA 25 - 2026-06-23 Administracion segura de usuarios

Fecha: 2026-06-23.

Acciones:

- Herramienta interactiva `ADMINISTRAR-USUARIOS.cmd`.
- Cambio individual de usuario, nombre, rol, vendedor asociado y clave.
- Claves almacenadas solamente como hash PBKDF2-SHA256.
- Respaldo automatico antes de modificar `users.json`.
- Soporte para editar el paquete origen o el servidor activo mediante `-UsersFile`.

Documento relacionado:

- `docs\ADMINISTRAR-USUARIOS-Y-CLAVES.md`

### BANDERA 26 - 2026-06-23 Reparto y cobranza digital

Fecha: 2026-06-23.

Estado de fase:

```text
Se inicia integracion de logistica de ultima milla y cobranza.
```

Acciones:

- Frontend subido a `8790-20`.
- Dispositivo Android convertido en unidad operativa persistente.
- Hoja de ruta automatica al despachar.
- Orden de paradas por prioridad, horario, distancia y antiguedad.
- Navegacion a Google Maps por cliente.
- Flujo `Despachado -> Bajar -> Controlado -> Entregado`.
- Cobranza en efectivo, transferencia o cuenta corriente.
- Alias bancario configurable por administracion.
- Cuenta corriente actualizada al entregar, sin doble carga.
- Firma digital obligatoria.
- Fotos opcionales de transferencia y entrega.
- GPS obligatorio en cada hito de entrega.
- Auditoria por dispositivo, usuario, fecha, hora y ubicaciÃ³n.

Documento relacionado:

- `docs\MODULO-REPARTO-COBRANZA-2026-06-23.md`

