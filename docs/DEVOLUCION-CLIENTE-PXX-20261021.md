# Devolucion del cliente sobre P1-P11

Estado: cambios locales, sin despliegue ni acceso a produccion.
Se conservan aparte los cambios locales previos de rendimiento.

## Preparado localmente

- P1: CMV se rotula "Costo de mercaderia vendida". Ganancia bruta ya existe;
  se aclara que falta costo historico completo en lugar de "No disponible".
  No se rellenan costos antiguos con precios actuales ni se inventa ganancia.
- Clientes: limite de cuenta deja de ser obligatorio; al editar se carga
  limite_credito, con alternativa limit y cero si ambos faltan.
- P3: seleccion de varios repartidores mediante casillas, opcion Todos,
  totales y exportacion con el mismo filtro. Sin recalcular liquidaciones.
- Conciliacion bancaria: desde/hasta inclusivos y limpieza de ambos filtros.
- P8: tabla diferenciada de ordenes de cobro sin asignar en planificacion;
  tabla de ordenes asignadas en la ruta activa, incluso sin pedidos.
  Reutiliza asignacion existente, sin crear pedidos ni movimientos de stock.
  El selector de destino se toma de la fila pulsada, evitando leer otro
  selector del mismo cobro en una seccion diferente.

## No cerrar como resuelto

- P2: sigue pendiente la verificacion del primer ajuste operativo real.
  Las capturas no describen un nuevo error de conteo concreto.
- Cobranza marcada como P5: la pantalla corresponde a correccion de cobros
  cerrados (P9). Falta mensaje de error, ruta/cobro y resultado esperado.
  Su regresion pasa, pero no reproduce el incidente del cliente.
- P7: solo aparece una cruz; se solicito detalle del fallo.
- Modificacion de cliente: una captura queda cortada despues de Estado;
  no permite identificar otra validacion ademas del limite de cuenta.
- P6: el cliente lo marca conforme.

## Pruebas ejecutadas

- smoke-client-feedback-20261021.js: PASS (filtro multiple, fechas limite,
  campo opcional, presencia en bolsa/ruta y ausencia de mutacion de datos).
- smoke-sales-commission-report-v139.js: PASS.
- smoke-collection-visits.js: PASS.
- smoke-p9-corrections.js: PASS (cierres inmutables e idempotencia).
- node --check app.js y git diff --check: PASS.

Pendiente validacion visual en navegador y prueba HTTP de asignacion desde
las nuevas tablas. Las pruebas de render usan DOM simulado; no equivalen
a validar la experiencia movil. No se declara listo para despliegue total.
