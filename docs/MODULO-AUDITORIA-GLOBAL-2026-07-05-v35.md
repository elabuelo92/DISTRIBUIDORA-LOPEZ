# Modulo Auditoria Global - v35

Fecha: 2026-07-05  
Sistema: Distribuidora Lopez - Servidor unico 8790

## Objetivo

Registrar automaticamente las acciones importantes del sistema para que Administracion pueda reconstruir que paso, quien lo hizo, desde donde y que valor cambio.

La auditoria no reemplaza los historiales propios de pedidos, reparto o sesiones: los centraliza en un historial global consultable.

## Datos registrados

Cada evento guarda:

- Usuario y nombre de usuario.
- Rol.
- Fecha y hora local.
- Fecha tecnica ISO.
- IP.
- Dispositivo.
- GPS si la operacion lo informa o si la sesion tiene ubicacion activa.
- Accion realizada.
- Tipo de entidad.
- Identificador de entidad.
- Valor anterior.
- Valor nuevo.
- Endpoint usado.
- Nota operativa.

## Acciones cubiertas en v35

- Inicio de sesion.
- Cierre de sesion.
- Intentos fallidos de login.
- Intentos de sesion duplicada.
- Cierre forzado de sesion.
- Cambio de politica de sesiones.
- Pedido creado.
- Pedido editado.
- Pedido avanzado de estado.
- Pedido marcado urgente o normal.
- Pedido cancelado.
- Movimiento de stock.
- Impresion de reporte de stock.
- Planificacion de ruta.
- Reordenamiento de ruta.
- Publicacion de ruta.
- Toma de ruta por repartidor.
- Cambio de estado de reparto.
- Cobranza y entrega.
- Cierre diario de reparto.
- Cambio de configuracion de reparto.
- Carga de evidencia/foto/comprobante.
- Cambio de estado de transferencia bancaria.
- Cambios sincronizados desde el cliente web en pedidos, clientes, productos, cuentas, stock, transferencias y rutas.

## Consulta desde Administracion

En la solapa:

`Administracion -> Auditoria global`

Filtros disponibles:

- Busqueda libre por accion, usuario, pedido, cliente, IP, dispositivo o nota.
- Entidad.
- Accion.

Cada registro permite desplegar:

- Valor anterior.
- Valor nuevo.

## API tecnica

Endpoint admin:

`GET /api/audit`

Parametros:

- `q`: texto libre.
- `entityType`: tipo de entidad o `all`.
- `entityId`: identificador exacto.
- `action`: accion exacta o `all`.
- `limit`: cantidad maxima, hasta 1000.

Ejemplo:

`/api/audit?entityType=pedido&entityId=PED-2080&limit=100`

## Persistencia

Los registros quedan dentro del estado principal:

`data/demo-state.json -> state.globalAudit`

Regla: no se eliminan desde el sistema operativo normal ni desde los resets de acumulados.

## Herramienta de soporte

La herramienta externa:

`scripts/support-maintenance.js`

incluye ahora el conteo:

`counts.globalAudit`

Esto permite verificar si el historial sigue creciendo despues de una operacion.

## Prueba de validacion

Script:

`scripts/smoke-v35.ps1`

Modo normal:

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\scripts\smoke-v35.ps1
```

Modo integracion con servidor temporal:

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\scripts\smoke-v35.ps1 -BaseUrl http://127.0.0.1:8796 -Integration -AllowStateReset
```

El modo integracion esta bloqueado contra el puerto 8790 para evitar resetear datos reales.

## Pendiente recomendado

En una fase posterior conviene exportar auditoria a CSV/PDF y agregar retencion por archivo historico mensual, sin borrar el historial operativo.
