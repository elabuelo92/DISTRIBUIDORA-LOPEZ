# Version 8790-130 - Reparto sin pedidos en Planificacion rapida

## Incidente

En produccion existian 36 pedidos con estado `Listo para Despacho`, pero la grilla de Planificacion rapida quedaba vacia.

## Causa raiz

El frontend llamaba a `normalizeForMatch()` dentro de `deliveryPlannerCandidates()`. Esa funcion no existe. La excepcion JavaScript interrumpia el render antes de insertar filas. La API y los pedidos productivos estaban correctos.

## Correccion

- Se reemplazaron las referencias invalidas por `normalizeSearchText()`.
- La elegibilidad se centralizo en `DeliveryEngine.isEligibleForRoutePlanning()`.
- La vista inicial abre en `Todos`.
- Se muestran contadores de pedidos listos, sin asignar y con ruta.
- GPS, horario y zona no forman parte de la regla de elegibilidad.
- La grilla muestra un mensaje explicito cuando los filtros no producen resultados.

## Seguridad de datos

La correccion modifica solamente codigo de consulta y presentacion. No migra, recrea ni cambia pedidos, estados, bultos, productos, importes, despachos o rutas.

## Validacion

Ejecutar:

```powershell
node scripts/smoke-delivery-planner-v130.js
node scripts/smoke-planner-scanner-v128.js
node scripts/smoke-order-workflow-v114.js
node scripts/smoke-cache-update-v126.js
```

Antes y despues del despliegue se debe ejecutar `scripts/order-dispatch-snapshot.js` para la fecha operativa y exigir diferencia cero.
