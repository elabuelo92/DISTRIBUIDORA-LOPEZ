# Fase de modificacion UX movil - 2026-06-17

## Estado de fase

Fecha: 2026-06-17.

Fase vigente:

```text
Fase de modificacion / experiencia movil y GPS obligatorio
```

No se avanza todavia a una fase nueva. Se mantiene la fase de modificacion porque se estan corrigiendo problemas de uso real detectados en celular.

## Material recibido

Archivo de referencia:

```text
C:\Users\Distribuidora Lopez\Downloads\WhatsApp Unknown 2026-06-17 at 07.57.53.zip
```

Se extrajeron capturas en:

```text
C:\DistribuidoraLopez\release\whatsapp-2026-06-17-075753
```

## Problemas detectados

- Encabezado de la app solapado con la barra superior de Android.
- Boton inferior de envio solapado con la barra de navegacion de Android.
- El usuario no tenia una zona clara para ver sesion y cerrar sesion en movil.
- Faltaba acceso visible a soporte tecnico por WhatsApp.
- `Demo Cordoba` seguia visible y podia confundir ubicacion real con simulacion.
- GPS todavia dependia de accion manual visible.
- Faltaba una base visual para hoja de ruta diaria, objetivos y recompensas.
- Login intermitente: el sistema mostraba `No se pudo conectar con el servidor` aunque las credenciales fueran correctas.
- Faltaba recupero de clave desde la pantalla de ingreso.
- Stock necesitaba pasar de tabla a panel administrador con graficos, buscador, exportacion, impresion y edicion protegida.
- El boton de impresion debia enviar directo a la impresora conectada al servidor.
- WhatsApp de soporte necesitaba quedar con el numero real informado.
- Administracion necesitaba avisos emergentes cuando ingresan pedidos desde celulares.
- Pedidos necesitaba trazabilidad, demora, urgencias, despacho y entrega.

## Cambios aplicados

Frontend:

- Version subida hasta `8790-15`.
- Viewport con `viewport-fit=cover`.
- Barra movil de sesion con usuario, rol, WhatsApp y salida.
- Boton superior `Cerrar sesion` mas explicito.
- Boton WhatsApp de soporte configurado a `5493512410535`.
- GPS obligatorio al iniciar sesion/app.
- Indicador visual de GPS: `Iniciando`, `Encendido`, `Bloqueado` o `Revisar`.
- Eliminado el boton visible `Demo Cordoba`.
- Agregado bloque `Hoja de ruta diaria`.
- Agregados objetivos diarios con progreso.
- Agregado boton `Abrir Maps` hacia el cliente seleccionado.
- Agregado asistente flotante animado con guia contextual.
- Agregado espacio inferior para que la barra Android no tape `Enviar pedido`.
- Login robusto: chequea `/api/health`, reintenta conexion y muestra diagnostico claro.
- Recupero de clave agregado en ingreso.
- Service worker actualizado hasta `v14`: evita mostrar login viejo cuando el servidor no responde y fuerza el modulo Stock nuevo.
- Modulo Stock administrador subido a `8790-13`.
- Panel de graficos de stock, buscador con desplegable, exportacion CSV/PDF e impresion.
- Edicion de producto protegida por reingreso de clave admin contra `/api/admin/reauth`.
- Impresion de Stock conectada al servidor mediante `/api/admin/print-stock`.
- Reporte de impresion generado en `data\print-jobs`.
- Bloqueo de impresoras virtuales/redirigidas para evitar falsas impresiones.
- Notificaciones emergentes para administradores ante pedidos nuevos de preventa movil.
- Trazabilidad de pedidos con etapas `Recibido`, `En armado`, `Listo reparto`, `En reparto` y `Entregado`.
- Calculo visual de demoras y urgencias.
- Acciones de administracion para avanzar etapa y marcar urgencia.

APK:

- Recompilada `DL Preventa GPS`.
- Ajustado WebView para respetar barras del sistema Android mediante WindowInsets.
- WebView configurado sin cache y con URL versionada `8790-12`.
- Fallback corregido a `desktop-c2c0q4v.tail6f19de.ts.net:8790`; no se usa IP directa.
- Se mantiene package separado:

```text
com.distribuidora.lopez.gps
```

APK generada:

```text
C:\DistribuidoraLopez\release\DL-Preventa-GPS-NATIVO-8790.apk
```

SHA256:

```text
08C91A46436ECB1A8C81DAE0093456A3983C8AD99A2C85995071E6D66BFD345B
```

## Pendiente dentro de esta misma fase

- Definir desde administracion la carga real de archivo/hoja de ruta.
- Definir premios, viaticos y metas mensuales reales.
- Probar APK instalada en telefono fisico y confirmar que no hay solape con barras Android.
- Definir proceso administrativo final para restablecer claves desde panel.
- Instalar/configurar la impresora fisica o de red y probar impresion real.
- Definir auditoria formal por producto para cambios de alto rango.
- Probar notificacion con dos dispositivos reales en simultaneo.
- Ajustar tiempos reales de demora por deposito y reparto.

## Criterio para pasar de fase

Pasar a la siguiente fase cuando:

- La APK quede validada en telefono real.
- GPS nativo quede activo sin intervencion manual.
- Pedido, stock y geolocalizacion sincronicen en una prueba completa.
- El flujo de sesion/cierre/soporte sea entendible para vendedor.

