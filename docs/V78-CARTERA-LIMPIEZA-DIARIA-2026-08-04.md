# V78 - Cartera nueva, limpieza diaria y etiquetas

Fecha: 2026-08-04
Version: 8790-78

## Objetivo

Dejar el servidor operativo con la nueva cartera de productos, sin buscador global, con pedidos activos limpios para iniciar una nueva jornada y con codigos de etiquetas sin guiones.

## Cartera de productos

Archivo importado:

`C:\Users\Distribuidora Lopez\Desktop\Nueva cartera de productos y sus listas.xlsx`

Resultado:

- Productos importados: 653.
- Cartera anterior reemplazada: 644 productos.
- Listas generadas: Lista Nº 1 a Lista Nº 5.
- Usuario Kevin asignado por defecto a Lista Nº 4, bloqueada salvo autorizacion administrativa.
- Backup previo generado en `data\backups\20260804-032906-importar-cartera-productos`.

## Limpieza operativa de pedidos

Se limpio la bandeja activa de pedidos para comenzar la proxima jornada sin contaminacion visual.

Importante: no se elimino la trazabilidad.

- Pedidos activos archivados: 32.
- Rutas archivadas: 4.
- Movimientos bancarios archivados: 2.
- Pedidos activos actuales: 0.
- Backup completo: `data\backups\2026-08-04T03-29-47-810Z-limpiar-pedidos-v78`.

Los pedidos archivados quedan disponibles en `archivedOrders` para auditoria, historial y respaldo tecnico.

## Vista diaria de pedidos

La solapa Pedidos filtra automaticamente por fecha local de Argentina.

- Durante el dia muestra solo pedidos de la jornada.
- Al cambiar de dia, la vista queda limpia para operar.
- El historial no se borra.
- La trazabilidad queda preservada en la base.

## Buscador global

Se elimino el buscador global de la interfaz principal.

Se mantienen unicamente buscadores especificos dentro de cada modulo:

- Pedidos.
- Clientes.
- Productos.
- Stock.
- Cuentas.
- Proveedores.

## Etiquetas sin guiones

Los codigos de bulto ya no contienen guiones.

Ejemplo:

- Antes: `PED-2456-B4`
- Ahora: `PED2456B4`

Validacion tecnica realizada:

- Pedido: `PED-2456`
- Bultos generados: `PED2456B1`, `PED2456B2`, `PED2456B3`, `PED2456B4`.

## Servidor activo

URL local:

`http://127.0.0.1:8790/index.html`

URL limpia para equipos con Tailscale:

`http://desktop-c2c0q4v.tail6f19de.ts.net:8790/index.html`

Nota: la IP directa de Tailscale puede responder distinto si Tailscale Serve tiene reglas propias. Para evitar dependencia de IP fija se debe usar MagicDNS.

## Validaciones realizadas

- `node --check app.js`
- `node --check order-engine.js`
- `node --check delivery-engine.js`
- `node --check server.js`
- `/api/health` local OK.
- `/api/health` por MagicDNS OK.
- Integridad OK.
- Productos: 653.
- Pedidos activos: 0.
- Buscador global ausente en HTML servido.

## Correccion post-arranque

Se corrigio el error de pantalla en blanco:

`Cannot access 'SYSTEM_PRICE_LISTS' before initialization`

Causa: la constante de listas de precios se inicializaba despues del primer `loadState()`.

Resultado validado:

- `SYSTEM_PRICE_LISTS` queda disponible antes de normalizar el estado.
- Chrome carga `#preventa` sin errores de pagina.
- La base conserva 653 productos, 5 listas de precios y Kevin asignado a Lista Nº 4.
