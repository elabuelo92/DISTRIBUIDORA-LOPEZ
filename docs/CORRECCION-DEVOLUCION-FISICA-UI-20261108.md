# Correccion de devolucion fisica desde Pedidos

Version prevista: `8790-202`

## Problema

La accion de recibir la devolucion dependia de cuadros nativos del navegador (`prompt` y `confirm`). En algunos navegadores integrados esos cuadros no se muestran o no devuelven el control correctamente, por lo que el boton parecia no responder.

## Cambio

- La confirmacion ahora se realiza en un dialogo dentro del sistema.
- El dialogo muestra el pedido y las cantidades por producto antes de operar.
- Motivo, confirmacion de regreso fisico y confirmacion de que no hubo un ajuste previo son obligatorios.
- El envio conserva el endpoint auditado existente, bloquea el doble envio y muestra errores sin cerrar el formulario.
- La operacion sigue sin aplicarse hasta que un administrador complete y confirme el formulario.

## Pruebas

- Prueba unitaria del motor: devolucion suma una sola vez, reservas intactas, repeticion idempotente y errores atomicos.
- Prueba P6: cancelacion definitiva de no entregado, historial de ruta y cierre intactos; pagos, comisiones y confirmaciones incompletas bloqueados.
- Prueba HTTP: solo Administracion, dos solicitudes simultaneas producen una unica entrada de stock.
- Verificacion estatica de UI: dialogo visible, sin prompt/confirm nativos, motivo y ambas confirmaciones obligatorias.
- `node --check app.js` y `git diff --check`.

## Publicacion segura

La publicacion debe mantener el modo de inventario con acceso exclusivo para `AgustinRocha` y `superadmin`. Antes de liberar el cambio se deben respaldar aplicacion y datos, comparar hashes de `demo-state.json` y `users.json`, comparar el snapshot de pedidos del dia, validar salud/licencia/integridad y confirmar que el mantenimiento siga activo. No se modifican pedidos ni stock durante el despliegue. El resultado y la ruta del respaldo quedan en el informe de entrega.
