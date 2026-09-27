# Incidente 2026-09-25: rutas planificadas y edicion de PED-2965

## Diagnostico de solo lectura

- `RUTA-20260925-JUEVES`: 39 paradas, asignada a `reparto2`, estado `Planificada`.
- `RUTA-20260925-ZONA-CENTRO`: 28 paradas, asignada a `reparto1`, estado `Planificada`.
- De los 67 pedidos, 60 estan `Listo para Despacho` y 7 estan `No entregado` por reprogramacion. Los 67 tienen etiqueta generada y bultos confirmados. Los 7 reprogramados ya tienen `stockSettled=true`.
- La consulta de rutas en la app de reparto oculta intencionalmente las rutas `Planificada`. La publicacion fallaba porque `assertDispatchChecklist` exigia `Listo para Despacho` antes de normalizar los pedidos reprogramados.
- PED-2965 fue creado con 11 unidades del producto 624 a $999. Una edicion lo llevo a 852 unidades; otra volvio a 11, pero cambio el precio a $908. La cantidad actual es 11. No se modifica este pedido automaticamente.

## Correccion local v154

- Publicacion de ruta: validar primero todos los pedidos y sus etiquetas/bultos sin mutar el estado; aceptar los estados reprogramables y, solo despues, avanzar el flujo. No volver a descontar stock ya asentado.
- Planificacion: mostrar estado de cada ruta, contador de rutas sin publicar del dia y boton `Publicar despacho` junto a cada hoja planificada.
- Edicion administrativa: mostrar cambios de cantidad, precio, descuento y total antes de guardar; exigir confirmacion especial y version vigente para cantidades anomalas. Una edicion sobre una version anterior devuelve 409.
- Actualizacion web: version 8790-154 y claves de cache nuevas.

## Pruebas locales

- `node scripts/smoke-delivery-operations-v132.js`: 60 pedidos y reprogramacion mixta, sin doble movimiento de stock; prevalidacion sin mutacion cuando falta etiqueta.
- `node scripts/smoke-delivery-planner-v130.js`: visibilidad de publicacion y contador.
- `node scripts/smoke-order-edit-safety-v154.js`: 11 a 852 es anomalo; 11 a 12 no.
- `node scripts/smoke-order-edit-safety-http-v154.js`: 409 sin confirmacion, 200 confirmado, 409 por version anterior.
- `node scripts/smoke-order-workflow-v114.js`, `node scripts/smoke-order-dispatch-protection-v126.js`, `node scripts/smoke-cache-update-v126.js`: regresion y barreras de despliegue.

## Despliegue y aceptacion

No desplegar antes de las 18:00 ART en dia habil sin autorizacion excepcional explicita. El procedimiento seguro detiene solo `distribuidora-lopez.service` durante respaldo y actualizacion; Caddy y otros servicios no se reinician. No prometer cero pausa del ERP: `data` ocupa aproximadamente 2,1 GB.

1. Releer rutas, estados de 67 pedidos, salud, version y Git remoto.
2. Confirmar autorizacion y ventana; respaldar `data` y snapshot de pedidos del dia antes de cambiar codigo.
3. Desplegar v154, regenerar integridad y reiniciar solo ERP. Verificar salud, licencia, integridad y version web.
4. Confirmar que rutas siguen planificadas y que pedido/cantidades/precios/stock no cambiaron por el despliegue.
5. Publicar cada ruta desde Administracion con operador autorizado; verificar 39 paradas en `reparto2` y 28 en `reparto1`, sin pedidos duplicados ni nuevo descuento de stock para los 7 reprogramados.
6. Si falla salud, integridad o comparacion, revertir. No restaurar una copia antigua de `data` sobre operaciones nuevas sin conciliacion.

La correccion de precio de PED-2965 es una decision comercial separada y requiere confirmacion; no forma parte del despliegue de codigo.
