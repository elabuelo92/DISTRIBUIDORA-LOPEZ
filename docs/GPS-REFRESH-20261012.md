# GPS corregido en reparto: primer bloque

Alcance: resolver coordenadas vigentes al aprobar una regeolocalizacion. La API
escribe latitud/longitud, pero el motor priorizaba aliases location/geolocation/gps.
Se reprodujo con datos ficticios el retorno de la coordenada vieja tras aprobar.

Cambios:
- Priorizar el par canonico valido. Conservar compatibilidad con pares legacy
  completos, sin mezclar latitud de una fuente con longitud de otra.
- Mantener propuestas pendientes fuera de la ubicacion operativa.
- Refrescar coordenadas de paradas pendientes; conservar las de visitas
  finalizadas, excepciones y rutas cerradas. No reconstruir historial perdido.
- Incluir coordenadas en la firma del mapa para reajustar la vista si cambian.
- Token frontend 8790-168-r20261012gps. Backend conserva version 8790-168.

Pruebas del paquete aislado:
- smoke-gps-refresh.js: prioridad GPS, pares legacy, aprobacion pendiente,
  historicos, rutas cerradas, navegacion y pedidos sin modificaciones.
- smoke-client-gps-review-v135.js: circuito HTTP completo con alias viejo,
  aprobacion, consulta de reparto, sincronizacion vendedor, permisos y cancelacion.
- smoke-delivery-operations-v132.js: planificacion, orden y despacho de 60 pedidos.
- smoke-delivery-planner-v130.js y smoke-second-visit-20260927.js: compatibilidad
  de planificacion y segunda visita sin movimientos extra de stock.

No incluidos: nuevas facultades de GPS para repartidores, cambios de dispositivos,
cobros, devoluciones de stock ni optimizacion estructural de persistencia.

Publicacion: usuario autorizo excepcionalmente reinicio controlado del ERP antes
de las 18:00 del lunes 12/10. Respaldar data y codigo, verificar integridad de los
datos antes/despues, publicar unicamente los archivos revisados y reiniciar solo
distribuidora-lopez.service. No crear pedidos ni corregir clientes reales como prueba.

Orden de siguientes bloques: diagnostico de cobros parciales/duplicados con IDs
concretos; devoluciones y stock; correccion auditada de cobranzas y multiples
transferencias; manifiestos imprimibles; demas mejoras de la revision del 9/10.
