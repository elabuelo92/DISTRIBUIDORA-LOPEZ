# Manifiestos PDF

Planificacion, ruta y cobros: ajuste de texto sin recorte de campos,
encabezados completos repetidos y filas de altura variable. Fuente 8 puntos.
Se conserva seleccion/filtro y calculo de importes; no se modifican pedidos.

El generador mantiene el modo anterior para reportes sin wrapText. Para
Stock/Stock fisico mejora tambien el calculo del ancho y los encabezados.

Pruebas sinteticas: 100 filas por manifiesto, textos largos, presencia del
ultimo registro y ausencia de puntos suspensivos. Pruebas de aislamiento
por ruta y cobros parciales reutilizadas. Paginas renderizadas con Poppler.
La normalizacion de acentos del generador existente no cambia.

Pendientes: validar exportacion real autenticada y legibilidad en papel.
Otros PDF, multiples comprobantes y ajustes contables siguen pendientes.
