# V79 - Preventa: alta de clientes, Mis Ventas e historial

Fecha: 2026-08-04
Version: 8790-79

## Objetivo

Completar la adaptacion del modulo Preventa al flujo del sistema anterior, reduciendo la curva de aprendizaje y separando mejor las tareas del vendedor.

## Alta de clientes

El alta movil queda reorganizada con campos obligatorios:

- Nombre comercial.
- CUIT/CUIL o Consumidor Final.
- Telefono.
- Domicilio real.
- Localidad.
- Zona comercial.
- Condicion de pago.
- Limite de credito.
- GPS real del dispositivo.
- Clave del preventista.

Antes de guardar, el servidor valida nuevamente la clave del usuario logueado. Si la clave es incorrecta, el cliente no se crea y se registra auditoria del intento rechazado.

## Zona comercial

La zona comercial queda separada de la geolocalizacion.

Opciones iniciales:

- Zona Norte.
- Zona Centro.
- Zona Sur.
- Zona 1.
- Zona 2.
- Zona 3.
- Fuera de Ruta.

## Mis Ventas

Se agrego la pestaña `Mis ventas` dentro de Preventa.

Muestra las ventas del preventista durante la jornada con:

- Numero de preventa.
- Fecha.
- Hora.
- Cliente.
- Importe.
- Estado.
- Forma de pago.

Incluye:

- Busqueda por numero, cliente, fecha, estado o importe.
- Detalle de productos de cada venta.
- Resumen de cantidad de pedidos, total vendido, promedio y comision.
- Exportacion CSV/Excel y PDF.
- Auditoria de consultas.

## Dashboard comercial del preventista

Se amplio el tablero movil con indicadores diarios:

- Clientes visitados.
- Ventas.
- Pendientes.
- Sin compra.
- Contactos por WhatsApp.
- Importe vendido.
- Comision.
- Cumplimiento.
- Ticket promedio.
- Pedidos.
- Estado GPS.

## Historial del cliente

Desde Preventa se agrego boton `Historial` para ver:

- Ultimas 10 compras.
- Ultima visita.
- Ultimo vendedor.
- Productos mas comprados.
- Promedio de compra.
- Saldo de cuenta corriente.
- Observaciones.
- Reclamos pendientes.
- Dias desde la ultima compra.

Tambien se agrego boton `WhatsApp` para contacto directo con el cliente y registro de la accion.

## Homologacion visual

La pantalla de Preventa queda organizada por pestanas:

- Pedido.
- Cliente nuevo.
- Mis ventas.
- Estado.

La idea es mostrar menos informacion por pantalla y mantener una logica parecida al sistema que ya conocen los vendedores.

## Correccion de arranque

Se mantiene corregido el error:

`Cannot access 'SYSTEM_PRICE_LISTS' before initialization`

Validacion:

- `SYSTEM_PRICE_LISTS` se inicializa antes de `loadState()`.
- `index.html` referencia `app.js?v=8790-79`.
- `sw.js` usa cache `v79`.

## Validaciones realizadas

- `node --check app.js`
- `node --check server.js`
- `node --check order-engine.js`
- `node --check account-engine.js`
- `node --check delivery-engine.js`
- `node --check legal-engine.js`
- Health temporal `http://127.0.0.1:8791/api/health`: OK, runtime `8790-79`.
- HTML servido en `8791`: contiene `app.js?v=8790-79`, `Mis ventas` y formulario nuevo.
- `app.js` servido en `8791`: contiene version `8790-79`, `SYSTEM_PRICE_LISTS` antes de `loadState()` y panel `Mis Ventas`.
- Endpoint `api/preventa/audit-consultation`: OK.
- Endpoint `api/clients/mobile`: rechaza clave incorrecta con HTTP 401.

## Bloqueo operativo detectado

El puerto principal `8790` sigue ocupado por un proceso Node viejo:

- PID Node: `12128`.
- Padre: `powershell.exe` PID `2452`.
- Windows devuelve `Acceso denegado` al intentar cerrar ambos procesos desde esta sesion.

Hasta cerrar ese proceso protegido, `http://127.0.0.1:8790/api/health` puede seguir mostrando `8790-78`.

Accion requerida:

1. Abrir Administrador de tareas como administrador.
2. Finalizar `node.exe` PID `12128`.
3. Finalizar `powershell.exe` PID `2452` si vuelve a levantar el servidor viejo.
4. Ejecutar `INICIAR-SERVIDOR-UNICO-8790.cmd` o `scripts\run-server-prod.ps1`.
5. Verificar `http://127.0.0.1:8790/api/health` y confirmar `runtimeVersion: 8790-79`.

## Paquete

El paquete de instalacion correspondiente es:

`release\DLPreventaServer-UNICO-8790-2026-08-04-v79-PREVENTA-CLIENTES-MIS-VENTAS.zip`
