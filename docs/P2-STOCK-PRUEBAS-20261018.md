# P2: conciliacion y carga inicial protegidas

## Alcance

Se reutilizan los movimientos, conteos y endpoints existentes. No hay migracion de datos ni carga de cantidades reales durante el despliegue.

- Conciliacion de conteo ejecutada por servidor y autorizada con clave administrativa.
- Motivo obligatorio; un conteo se aplica una sola vez.
- Si cambio el stock fisico desde el conteo, se rechaza el ajuste.
- Si el conteo queda por debajo de las reservas, se rechaza; no se eleva silenciosamente la cantidad ni se borran reservas.
- Pantalla usa stock fisico como esperado, sin reconstruirlo mediante la suma de estados visuales de pedidos.
- Movimientos del ajuste no aparecen duplicados en el historial.
- Carga inicial valida codigo exacto o identificador alternativo unico. Un codigo incorrecto no deriva a otro producto por nombre.
- Cantidades vacias, negativas o fraccionarias rechazadas.
- Vista previa compara fisico y reservas antes de aplicar el lote completo.
- Identificador de carga impide repetir el mismo lote; diferencias cero no generan movimientos.
- Se mantiene el respaldo previo de carga inicial y la asignacion existente de nuevas existencias a pedidos pendientes.

## Procedimiento de carga real

1. Identificar responsable, fecha y movimientos pendientes. Exportar existencias y reservas.
2. Contar por codigo y unidad base, con motivo de carga.
3. Generar vista previa y revisar diferencias. Resolver reservas mayores al conteo.
4. Confirmar el lote. El servidor crea respaldo y registra diferencias auditadas.
5. Verificar movimientos y existencias. No borrar registros para revertir; efectuar ajuste compensatorio autorizado.

## Pruebas aisladas aprobadas

- `smoke-stock-reconciliation.js`: incrementos/reducciones, cero diferencia, reservas, motivo, repeticion, cantidades invalidas, conteo desactualizado, codigo errado y lote de 100 productos atomico.
- `smoke-order-workflow-v114.js`: servidor HTTP ficticio, clave incorrecta, conciliacion, repeticion, reservas conservadas, carga inicial y bloqueo de repeticion. Pedidos identicos despues de ambas operaciones.
- `smoke-rejected-stock-return.js`: devolucion una sola vez, dos solicitudes simultaneas, permiso administrativo y mismo pedido original.
- `smoke-remit-reconcile-v153.js`: correccion/agregado de remito y stock sin duplicacion. Usuarios ficticios, no copia de credenciales reales.
- `smoke-historical-cost.js`: snapshots y corte de P1 conservados.

La prueba HTTP requirio habilitar conexiones locales fuera del sandbox; el primer intento no podia consultar el servidor temporal. No fue un fallo de produccion.

## Pendientes explicitos

- Sobrestock aplazado por el usuario; no se inventan maximos.
- No se aplico inventario real: requiere conteos aprobados.
- Revision visual administrativa y prueba operativa con usuario quedan pendientes; las pruebas anteriores son automatizadas y ficticias.
- Publicacion: pendiente al redactar este registro. Registrar respaldo, version y comparacion posterior antes de dar por publicado.

## P1 ya publicado

Version 8790-170, commit 624310a, respaldo emergency-20261019-015805.
Comparacion completa de demo-state.json y users.json identica; servicio, licencia e integridad correctos.
Reporte historico sin costos conserva CMV/ganancia desconocidos. La fecha de corte persistente se inicia con la primera nueva linea real, no con una venta ficticia.
Revision visual de P1 aplazada expresamente por el usuario.
