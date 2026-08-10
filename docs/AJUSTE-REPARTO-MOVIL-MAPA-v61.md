# v61 - Reorganizacion Reparto Movil y mapa de hoja de ruta

Fecha de corte: 2026-07-21

## Objetivo

Mejorar la experiencia del repartidor en celular priorizando la informacion operativa activa.

## Cambios aplicados

- La hoja de ruta activa queda arriba del modulo Reparto.
- Se agrega panel de progreso de ruta:
  - porcentaje gestionado
  - entregadas
  - incidencias
  - pendientes
  - efectivo
  - transferencias
  - saldo pendiente
- Se agrega tarjeta de proxima parada.
- Se agrega boton "Abrir recorrido" para abrir Google Maps con las paradas pendientes.
- Se agrega mapa interactivo de la ruta activa.
- El mapa toma datos desde:
  - coordenadas del cliente, cuando existen
  - domicilio del cliente/pedido mediante Google Maps, cuando no hay coordenadas
- Las paradas entregadas se ocultan del listado operativo.
- Las hojas de ruta disponibles quedan debajo de la ruta activa.
- Los datos de dispositivo pasan al final de la pantalla.

## Regla de datos

Para que el mapa sea exacto, cada cliente debe tener:

- coordenadas GPS reales, o
- domicilio valido y completo.

Si Google Maps no carga o el cliente no tiene datos suficientes, el sistema no muestra un mapa falso. Mantiene disponibles los botones de navegacion por parada.

## Impacto

No se modifico el flujo de cobranza ni cierre de caja. Es una mejora de disposicion, navegacion y lectura en la app de reparto.
