# Release 8790-201: excepcion temporal de mantenimiento

## Alcance

- Mantiene activo el modo inventario.
- Autoriza unicamente administradores con usuario `superadmin` o `AgustinRocha`.
- Los demas administradores, vendedores y repartidores siguen bloqueados.
- No cambia pedidos, usuarios, stock, reservas, saldos ni movimientos.
- El estado de la lista permitida no se expone en la respuesta publica de salud.

## Validacion

- Pruebas unitarias de politica: AgustinRocha y superadmin permitidos; otros usuarios y roles bloqueados.
- Prueba HTTP con datos temporales: AgustinRocha llega al inicio de sesion; otros administradores y vendedor reciben mantenimiento.
- Prueba previa del modo mantenimiento: pagina, API y retorno al desactivar pasan.
- `node --check` para `server.js` y `maintenance-access.js`.

## Despliegue

Pendiente de publicacion con backup y reinicio controlado. La sesion actual se cierra al reiniciar; AgustinRocha debe volver a ingresar.
