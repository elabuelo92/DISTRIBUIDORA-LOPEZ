# Manifiesto previo de planificacion - 8790-140

## Alcance

La grilla `Reparto -> Planificacion rapida` permite exportar en cualquier momento los pedidos seleccionados. Si no existe seleccion, exporta exactamente los resultados visibles segun los filtros activos.

## Formatos

- CSV UTF-8: datos completos para ordenar, filtrar o analizar externamente. Incluye domicilio, referencia, telefono, localidad, zona, ruta comercial, bultos, importe, horario, vendedor, estado, ruta de reparto, repartidor, GPS, coordenadas y enlace de Maps.
- PDF: manifiesto operativo horizontal, tabulado en filas y columnas, con los campos esenciales para revision e impresion.

## Seguridad operativa

La exportacion se genera en el navegador. No crea rutas, no cambia estados, no altera el orden persistido y no modifica pedidos, stock ni cobranzas.

## Criterio de seleccion

1. Si hay pedidos seleccionados, exporta todos los seleccionados aunque alguno quede oculto por un filtro posterior.
2. Si no hay seleccion, exporta los resultados que cumplen los filtros actuales.
