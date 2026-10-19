# P4 - Comisiones de vendedores

Estado: implementado localmente. Pendiente revision visual y despliegue controlado.
No se modificaron reglas reales, pedidos, pagos ni liquidaciones de produccion.

## Causas y correcciones

- Todos: el nombre vacio coincidia con el username ausente del primer vendedor.
  Ahora el alcance general no resuelve ninguna persona.
- Selectores: combinar catalogo de vendedores con usuarios seller; incluir nombres
  historicos en el filtro del reporte. No se fusionan nombres diferentes ni se
  reasignan pedidos. Identidades historicas que no coinciden requieren auditoria.
- Edicion: conservar el destinatario de una regla aunque falte en las opciones;
  rechazar destinatario desconocido en lugar de convertirlo silenciosamente en Todos.
- Pagos/exportaciones: reemplazar funcion de fechas inexistente por localTraceParts.
  La prueba anterior simulaba la funcion inexistente; ahora ejecuta el helper real.
- Busqueda/filtros de reglas: actualizar solo tabla, sin reconstruir todo el modulo.
- Guardado: bloquear doble clic y dejar confirmacion visible con alcance y porcentaje.
- Periodo invertido: indicar error y no generar exportaciones aparentemente vacias.

## Pruebas locales

- smoke-p4-commissions: Todos, tres vendedores, Kevin desde usuarios, fecha Argentina,
  destinatario desconocido, filtros focalizados y liquidaciones intactas.
- smoke-commission-numeric-export: XLSX real, importes numericos, pagos, decimales,
  periodo invalido, datos invalidos y fuente sin cambios.
- smoke-commission-governance-v122: versiones de reglas, conflictos e historial.
- smoke-commission-account-v134: pagos parciales, liquidacion y bloqueo de exceso.
- smoke-sales-commission-report-v139: reporte de ventas y comisiones.
- smoke-driver-commission-report: regresion P3, sin recalculo de importes guardados.

## Antes de publicar

- Verificar visualmente filtros, edicion y confirmacion en demo aislada.
- Auditar presencia real de Kevin/Ruggero sin cambiar sus identidades por inferencia.
- Versionar paquete, respaldar datos y publicar en ventana autorizada.
- Comparar integridad antes/despues y validar modulo en produccion.
