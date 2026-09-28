# Tablero y Estadisticas: vista previa local

No desplegado. Sin cambios de backend, datos ni permisos.

## Tablero
- Logos actuales, fecha operativa Argentina y cuatro indicadores existentes.
- Accesos directos respetando la visibilidad de los modulos.
- Herramientas: estado de pedidos, alertas, equipo en vivo, recorridos, actividad y comisiones.
- Mapa y recorridos se renderizan al abrir su herramienta.
- Al abrir un detalle se oculta el resumen superior; volver restaura el inicio.

## Estadisticas
- Ventas y consumo, ingresos y egresos, reposicion, faltantes, ventas por ruta, clientes y capital.
- Se trasladan los paneles originales conservando controles, filtros, eventos y exportaciones.
- La portada no construye reportes; faltantes y ventas por ruta se procesan solo al abrir esas herramientas.
- Iconos Lucide 0.468.0 distribuidos localmente, con licencia en icons/tools/LICENSE.

## Verificacion
- Sintaxis app.js y smoke-statistics-hub.js.
- Demo aislada con 100 pedidos: seis herramientas del tablero y seis de Estadisticas, un solo panel visible, regreso al inicio y filtro de faltantes preservado.
- Comprobacion visual de escritorio y ancho 390px, logos e iconos cargados.
- No se generaron pedidos ni se realizaron cobros durante estas pruebas.
