# Modulo Centro de Notificaciones - v36

Fecha: 2026-07-05  
Sistema: Distribuidora Lopez - Servidor unico 8790

## Objetivo

Agregar un centro de avisos en tiempo real para que Administracion vea eventos importantes sin revisar manualmente cada modulo.

## Eventos cubiertos

El sistema genera notificaciones cuando:

- Se crea un pedido.
- Se modifica un pedido.
- Se supera el limite de credito.
- Cambia el estado de un pedido.
- Se despacha un pedido.
- El repartidor toma/inicia una ruta.
- Se entrega un pedido.
- Se sube un comprobante de transferencia.
- Se rechaza un comprobante.
- Se registra una devolucion.
- Se cierra una ruta diaria.

## Persistencia

Las notificaciones se guardan en:

`data/demo-state.json -> state.notifications`

No se borran con el uso normal del sistema. La lectura del aviso es local por usuario y no elimina el historial.

## Visualizacion

Dentro del sistema aparece el boton:

`Avisos`

Funciones:

- Contador de no leidas.
- Panel lateral de notificaciones.
- Filtro por urgencia.
- Filtro por categoria.
- Busqueda por pedido, cliente, ruta, comprobante o usuario.
- Boton `Ver` para saltar al pedido, ruta, cliente, stock o reparto relacionado.
- Boton `Marcar leidas`.

## Tiempo real

El sistema usa la sincronizacion activa del panel cada pocos segundos. Cuando el servidor recibe un evento nuevo, los usuarios conectados lo ven como aviso emergente y tambien queda en el centro.

## Relacion con Auditoria Global

Auditoria Global registra el detalle tecnico del cambio:

- usuario,
- IP,
- dispositivo,
- GPS,
- valor anterior,
- valor nuevo.

Centro de Notificaciones registra el aviso operativo legible:

- titulo,
- texto,
- categoria,
- urgencia,
- entidad relacionada.

Ambos modulos se complementan.

## Prueba de validacion

Script:

`scripts/smoke-v36.ps1`

Modo normal:

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\scripts\smoke-v36.ps1
```

Modo integracion con servidor temporal:

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\scripts\smoke-v36.ps1 -BaseUrl http://127.0.0.1:8796 -Integration -AllowStateReset
```

El modo integracion esta bloqueado contra el puerto 8790 para proteger datos reales.
