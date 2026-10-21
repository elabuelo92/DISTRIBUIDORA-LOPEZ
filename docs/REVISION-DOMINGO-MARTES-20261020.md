# Revision del domingo 18 al martes 20 de octubre de 2026

Resultado: 18/18 suites automatizadas aprobadas en la ultima ejecucion local aislada.
Evidencia detallada: REVISION-P1-P8-20261020-results.json.
Ejecutor: scripts/review-p1-p8.js. No accede a produccion.

La columna de publicacion se basa en las actas y commits locales de despliegue; esta revision no reemplaza una nueva inspeccion del servicio en vivo. No hubo despliegue, reinicio ni modificaciones de datos reales durante esta tarea.

| Punto | Publicacion registrada | Pruebas repetidas | Pendiente |
| --- | --- | --- | --- |
| P1 - CMV y ganancia bruta | 8790-170 | Costo historico, corte, periodo estadistico | Revision visual administrativa; historico sin costo sigue sin inventarse |
| P2 - Conteo y ajuste de stock | 8790-171 y correccion 8790-176 | Diferencias, reservas, conteo persistente, doble envio, HTTP | Conteo real aprobado por operador; sobrestock aplazado |
| P3 - Comisiones de reparto | 8790-172 | Reporte y exportacion de comisiones existentes | Validacion visual con operador; no recalcular liquidaciones |
| P4 - Comisiones de vendedores | 8790-173 | Alcance, filtros, periodo semanal, importes numericos Excel | Comprobacion funcional administrativa |
| P5 - Pendiente de cliente vs caja | 8790-174 | Transferencias prometidas, manifiesto, cierre y HTTP | Comprobacion del operador en ruta real, sin alterar cierre historico |
| P6 - Cancelacion No entregado | 8790-175 | Devolucion una vez, permisos, concurrencia, HTTP y regresion Rechazado | Revision visual; no se aplico ajuste real al PED-3776 |
| P7 - Edicion de clientes | Local, no publicado | ID/paginacion, horarios, saldos, doble envio, persistencia HTTP, cierre/scroll simulado | Aceptacion visual y despliegue con respaldo |
| P8 - Ordenes de cobro | Motor local, no integrado | Cobro parcial, validacion, reintentos, asignacion, GPS actual, sin ventas/stock/comisiones | API, pantallas, manifiestos y cierre integrados; luego pruebas end-to-end |

## Hallazgos y correcciones locales

- P7: lista paginada fuera de state.clients y nombres que podian confundirse con codigos. Corregidos con prioridad por identificador exacto y rechazo de ambiguedades.
- P7: error de horario antes del bloque de captura, ausencia de confirmacion y doble envio. Se conserva formulario ante error y se confirma/cierra al guardar.
- P7: una consulta anterior podia repoblar cache obsoleta. Se descarta por secuencia y se refresca despues de guardar.
- P7: cancelar la ficha mientras guarda podia interferir con el resultado; cancelacion bloqueada durante la solicitud.
- P8: prototipo no consultaba estado actualizado tras validar transferencia. Se agrego resumen que usa conciliacion vigente.
- P8: reforzados tipos monetarios, importes ya comprometidos, nombres ambiguos, firma de reintento y comparacion de centavos.
- P8: API/UI no existian; el motor probado NO constituye una funcionalidad publicada.

## Checklist operativo antes de publicar lo nuevo

- [ ] P7: editar cliente de segunda pagina; confirmar dia/horario, cierre, scroll y reapertura con valores guardados.
- [ ] P7: clave/horario invalidos conservan la ficha; doble clic no duplica historial.
- [ ] P8: completar integraciones indicadas en P8-ORDENES-COBRO-20261020.md.
- [ ] P8: ruta con solo ordenes de cobro, no cobrada, pago parcial y transferencia observada/validada.
- [ ] P8: verificar manifiesto y caja por ruta, sin duplicar el cobro de cuenta corriente ni generar venta/comision.
- [ ] Comparacion de datos protegidos, respaldo y despliegue controlado solo del paquete validado.
- [ ] Prueba visual desktop/movil con usuario autorizado.

## Limites de esta revision

Son pruebas funcionales de datos ficticios, no una simulacion de todos los usuarios reales ni una garantia de ausencia de lentitud. No se verificaron visualmente las pantallas en esta ejecucion. Los tiempos del archivo JSON son duraciones de tests, no latencias de produccion.

P9, P10 y P11 siguen pendientes de integracion/aceptacion en este checkout; no se incluyen como funcionalidades publicadas. La regla comercial 1% cigarrillos / 3% resto sigue aplazada y no fue aplicada por esta tarea.

Decision: NO-GO para desplegar P8 hasta completar integracion y pruebas. P7 requiere aceptacion visual antes del despliegue. Los 18 PASS no eliminan esos pendientes.
