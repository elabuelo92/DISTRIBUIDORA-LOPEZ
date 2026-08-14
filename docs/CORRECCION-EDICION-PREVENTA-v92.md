# Correccion de edicion de preventa - v92

Fecha: 14/08/2026

## Problema

Al guardar una modificacion de pedido desde Administracion, el servidor respondia:

`normalizeForMatch is not defined`

El error se producia al comparar los productos originales con los productos editados para determinar si existia un cambio economico sujeto a permisos y auditoria.

## Correccion

- Se reemplazo la referencia inexistente `normalizeForMatch` por el normalizador vigente del servidor, `normalizeSearchText`.
- Se mantuvo la validacion de permisos para cambios de precio o descuento.
- Se mantuvo obligatorio el motivo de la modificacion.
- Se incremento la version y el cache de la aplicacion a `8790-92` para evitar que los dispositivos conserven recursos anteriores.

## Prueba requerida

1. Iniciar sesion con un administrador.
2. Abrir Pedidos y editar un pedido anterior a Despachado.
3. Modificar cantidad, producto, precio u observaciones.
4. Completar el motivo obligatorio.
5. Guardar y comprobar respuesta exitosa, datos actualizados y registro de auditoria.

La prueba no debe modificar pedidos reales de produccion; debe ejecutarse sobre un pedido temporal creado para validacion y luego cancelado o sobre datos aislados.
