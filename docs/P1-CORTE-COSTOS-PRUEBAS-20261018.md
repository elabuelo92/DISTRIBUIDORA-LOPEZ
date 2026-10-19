# P1: corte de costos y verificacion

Estado: implementado localmente, pendiente de despliegue. Produccion consultada solo en lectura; sin reinicios ni escrituras.

## Decision

El usuario autorizo dejar los historicos sin reconstruir. Ninguna de las 13452 lineas inspeccionadas tenia costo guardado. No se reemplaza por el costo actual. La captura comienza con la primera nueva linea creada con esta version y deja fecha persistente en costHistory.startedAt. El despliegue no debe transferir estado de demo.

Metodo: costo de catalogo a la entrada de cada linea, no valuacion FIFO ni promedio de inventario. Ganancia bruta = ventas menos devoluciones menos CMV. No incluye otros gastos. Las devoluciones se atribuyen al pedido original y su periodo, no a un libro de ajustes por fecha de devolucion.

## Pruebas locales

- smoke-historical-cost: snapshot desde catalogo, ignora valores enviados en la linea, conserva costos al editar/reordenar, nuevo producto captura nuevo costo, conserva desconocidos historicos, cero explicito y valores invalidos, devolucion parcial con descuento y total, sin mutaciones por reporte, corte persistente.
- smoke-statistics-period: semana Argentina, exclusiones, deduplicacion activos/archivados, totales, faltantes, periodo invalido, contrato Excel numerico.
- smoke-preventa-line-discounts: descuentos por ID, aprobacion/rechazo, cantidades y duplicacion de aprobacion.
- smoke-order-edit-safety-v154: cantidades anormales y edicion obsoleta.
- smoke-statistics-hub: herramientas y permisos existentes.
- smoke-order-workflow-v114: servidor HTTP temporal, usuario ficticio, armado/etiquetas/verificacion, persistencia de costo y corte. Requiere permiso de localhost fuera del sandbox. Nunca copia usuarios reales.
- node --check app.js y order-engine.js.

Prueba de calculo aislado: 100 pedidos x 10 reportes en 12.5 ms en una ejecucion. No es benchmark de produccion ni de concurrencia/API/BD.

## Checklist previo y posterior al despliegue

- [x] Revisar Estadisticas en demo movil: 10000 de venta, 3000 CMV, 7000 ganancia y corte visible.
- [x] Generar y leer XLSX real con ExcelJS, verificar importes numericos. Exportacion disparada desde la demo.
- [ ] Revision adicional en escritorio y apertura manual en Excel por el usuario.
- [ ] Respaldo de datos/usuarios y codigo actual antes de publicar.
- [ ] Publicar solo cambios revisados; actualizar version de cache/integridad segun procedimiento del ERP.
- [ ] Verificar salud, sesiones y ausencia de mantenimiento tras reinicio controlado si corresponde.
- [ ] Confirmar que el primer pedido nuevo registra costo y fecha de inicio, sin escribir pedidos ficticios en produccion.
- [ ] Confirmar periodo anterior muestra costo desconocido y conserva importes/pedidos/stock.
- [ ] Confirmar Excel incluye corte y listado de faltantes, importes numericos y devoluciones.
- [ ] Comparar integridad antes/despues y validar con usuario administrador.

Paquete preparado localmente. No se anuncia desplegado ni validado en produccion hasta realizar respaldo y verificaciones de publicacion. El reporte no afirma cobertura completa de costos anteriores al corte. Demo temporal cerrada al finalizar las pruebas.
