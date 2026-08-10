# Herramienta externa de soporte y mantenimiento

## Objetivo

Permitir cambios grandes o resets controlados sin editar archivos internos del sistema.

La herramienta esta pensada para soporte tecnico. El cliente puede operar el ERP, pero no debe modificar `demo-state.json`, scripts ni configuraciones internas.

## Acceso

Ejecutar desde la carpeta del servidor:

`SOPORTE-MANTENIMIENTO.cmd`

En la instalacion actual:

`C:\DLPreventaServer\SOPORTE-MANTENIMIENTO.cmd`

## Seguridad

- No hereda rutas viejas de Windows por defecto.
- Trabaja sobre la carpeta donde esta instalada la herramienta.
- Toda accion de escritura genera backup automatico.
- Las acciones peligrosas piden una frase exacta de confirmacion.
- Los parametros editables salen a un archivo controlado: `data\parametros-soporte.json`.

## Opciones disponibles

### Ver diagnostico

Muestra:

- Cantidad de clientes, productos y pedidos.
- Saldos acumulados.
- Ventas acumuladas.
- Rutas y auditoria de reparto.
- Alias de cobranza.
- Numero de WhatsApp de soporte.

No modifica datos.

### Crear backup manual

Copia estado, configuracion y parametros a:

`data\support-backups`

### Exportar parametros editables

Genera:

`data\parametros-soporte.json`

Campos permitidos:

- WhatsApp de soporte.
- Uso de Google Maps.
- API key de Google Maps.
- Alias bancario.
- Nombre de cuenta bancaria.
- Coordenadas base del deposito.

### Aplicar parametros editados

Lee `data\parametros-soporte.json` y aplica solo los campos permitidos.

Frase de confirmacion:

`APLICAR PARAMETROS`

### Reset acumulados operativos

Sirve para iniciar una nueva etapa operativa conservando maestros.

Conserva:

- Clientes.
- Productos.
- Proveedores.
- Usuarios.
- Stock fisico.
- Configuracion.

Resetea:

- Pedidos.
- Cuentas/movimientos acumulados.
- Movimientos de stock historicos.
- Actividad operativa.
- Faltantes.
- Rutas de reparto.
- Auditoria de reparto.
- Ventas, pedidos y comisiones de vendedores.
- Reservas de stock.

Frase de confirmacion:

`RESET ACUMULADOS`

Opciones avanzadas por consola:

- `--clear-gps`: tambien limpia GPS de vendedores.
- `--clear-transit`: tambien limpia mercaderia en transito.
- `--zero-client-balances`: tambien pone saldos de clientes en cero.

### Reset rutas y cobranza

Limpia rutas y auditoria de reparto.

Si un pedido estaba en `Bajar` o `Controlado`, vuelve a `Despachado`.

Frase de confirmacion:

`RESET RUTAS`

### Reset GPS vendedores

Limpia ubicaciones guardadas de vendedores.

Frase de confirmacion:

`RESET GPS`

### Reset saldos de clientes

Pone en cero las cuentas corrientes de clientes y limpia movimientos de cuenta.

Frase de confirmacion:

`RESET SALDOS CLIENTES`

## Uso por consola

Diagnostico:

`node scripts\support-maintenance.js status`

Exportar parametros:

`node scripts\support-maintenance.js export-parameters`

Aplicar parametros:

`node scripts\support-maintenance.js apply-parameters --confirm="APLICAR PARAMETROS"`

Reset acumulados:

`node scripts\support-maintenance.js reset-accumulators --confirm="RESET ACUMULADOS"`

## Recomendacion operativa

Para cambios grandes en la distribuidora:

1. Crear backup manual.
2. Exportar parametros.
3. Editar `data\parametros-soporte.json`.
4. Aplicar parametros.
5. Ver diagnostico.
6. Recien despues ejecutar un reset, si corresponde.

Nunca editar directamente `data\demo-state.json`.
