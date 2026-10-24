# Prioridades operativas - 24/10/2026

Estado: implementado localmente. Pendiente de despliegue. La etapa inicial no accedio a produccion; el 24/10 se consulto salud en modo lectura. Sin escrituras de negocio productivas.

## 1. Conteo comprensible y seguro

El inventario general guarda la referencia inicial, pero NO detiene ventas, reservas ni despachos.
La tabla separa fisico al inicio, fisico actual, cantidad contada, diferencia y accion.

Circuito nuevo:

1. Control fisico > Conteo y trazabilidad > Iniciar inventario.
2. Buscar el producto y presionar Comenzar conteo inmediatamente antes de contarlo.
3. Contar el fisico del deposito, incluyendo lo reservado/armado que todavia no fue despachado.
4. Ingresar Contado ahora y Guardar conteo. Guardar no modifica stock.
5. Revisar la diferencia y autorizar el ajuste con motivo y clave administrativa.
6. Finalizar inventario cuando no queden diferencias pendientes ni borradores locales.

Ejemplo: inicio 100; despacho de 20 antes de empezar ese producto; referencia individual 80.
Se cuentan 75: diferencia -5. Entran 7 despues de guardar: stock 87.
Al autorizar, se aplican -5 y quedan 82, conservando ese ingreso y las reservas.

Si cambia stock, reserva o movimiento registrado DURANTE el conteo individual, se exige volver a contar.
La referencia individual dura 15 minutos, pertenece al administrador y vence si se reinicia el servidor.
Un error de red conserva borrador e identificador para reintentar sin duplicar. Una referencia invalidada conserva la cantidad visible pero no permite aplicarla.
Los conteos antiguos siguen utilizando su referencia al corte, sin conversion ni recalculo historico.
Excel/PDF distinguen tipo de referencia e inicio del conteo.

## 2. Cobranza bloqueada

Reparto > Corregir cobranzas cerradas > Consultar cierres.

Se permite reemplazar una transferencia pendiente con trazabilidad completa mediante un ajuste vinculado al cobro original.
Solo se revierte dinero efectivamente acreditado; una promesa pendiente no se convierte en deuda adicional.
El comprobante reemplazado queda visible como Reemplazada y no puede volver a validarse, editarse ni acreditarse.
Las nuevas transferencias siguen necesitando comprobante, banco, operacion y validacion bancaria.
La previsualizacion muestra saldo, reverso aplicado, pendientes reemplazados y saldo posterior.
La variacion de transferencia incluye lo declarado pendiente; no equivale a un debito en cuenta. El reverso solo incluye pagos acreditados.

Se conservan bloqueos de seguridad: cliente ambiguo, comprobantes sin trazabilidad, impacto bancario inconsistente, triangulacion, saldo a favor y correccion previa.
Una validacion bancaria concurrente invalida la previsualizacion anterior.
No se borran ni reabren cierres, ni se reescriben los comprobantes originales.
Adicional: consultar rutas cerradas ya no vuelve a ordenar sus paradas ni cambia updatedAt por ese reordenamiento.

Caso real del cliente: falta identificar pedido/ruta para verificar si coincide con el caso reproducido. No se modifico ninguna cobranza real.

## 3. Efectivo de reparto

Tablero > Efectivo de reparto; indicador de efectivo de rutas abiertas en la portada.
Detalle por ruta: efectivo cobrado, gastos registrados, correcciones vinculadas, efectivo esperado y declarado al cierre.
Incluye todas las rutas abiertas y las cerradas hoy, con fechas de Argentina. Son acumulados de esas rutas, no exclusivamente cobros de hoy.
Las visitas de cobranza ya estan incluidas en cashTotal y no se suman nuevamente.
Las transferencias y promesas no cuentan como efectivo.
El declarado al cierre NO prueba recepcion fisica por Administracion; los gastos no registrados no se pueden descontar.
Los cierres anteriores conservan su importe original; las correcciones aparecen por separado.

## 4. Estadisticas por producto

Estadisticas > Ventas y consumo > Desde/Hasta.
Columnas: codigo, producto, cantidad neta, importe facturado, devoluciones, ventas netas, costo total (CMV) y ganancia bruta.
Importe facturado respeta descuentos aprobados. Ganancia bruta = ventas netas menos costo historico de las unidades no devueltas.
Sin costo historico suficiente, costo/ganancia del producto quedan pendientes, nunca estimados con el catalogo actual.
Si falta costo en otro producto, los productos con cobertura completa igualmente muestran su resultado.
Una diferencia entre el total de pedidos y su detalle se informa como importe sin detalle conciliado, no se distribuye inventando precios.
Excel real con hojas Productos y Resumen, importes numericos, filtros, encabezados fijos y formato monetario.

## Pruebas

- 38 suites de regresion P1-P11 y prioridades aprobadas: PRIORIDADES-REGRESION-20261024-results.json.
- Unidades nuevas: smoke-stock-current-count, smoke-pending-collection-correction, smoke-delivery-cash-overview y smoke-product-statistics.
- Regresiones adicionales: stock-cut, tabular-exports, readable-exports, sales-commission-report-v139 y statistics-period.
- HTTP de conteo: siete usuarios, reintentos, concurrencia, permisos, reserva/saldo sin cambios indebidos, movimientos posteriores conservados.
- Navegador desktop/movil: ciclo de conteo y autorizacion; efectivo; estadisticas; descarga XLSX leida con tipos numericos; previsualizacion Y confirmacion de cobranza pendiente.
- Pruebas HTTP comparan originales completos. La prueba visual compara tambien los historicos inmediatamente antes/despues del ajuste, luego de inicializar la aplicacion.
- Primera carga con copia de 98 MB: fallo la comparacion historica porque el ingreso de mercaderia recalculaba la fecha de comisiones de pedidos cancelados/rechazados que ya estaban en cero. Evidencia conservada: PRIORIDADES-VOLUMEN-20261024-results.json.
- Correccion: preservar la comision ya anulada, sin reemplazar sus reglas ni cambiar su fecha. Se conserva la reparacion anterior para cancelaciones que todavia tengan importes no nulos. Nueva regresion: smoke-commission-normalization-stability.
- Segunda carga: diez rondas (20 ventas, 20 cobros y 10 movimientos de stock) y ciclo visual aprobados; comparacion historica del conteo actual aprobada. Luego fallo una conexion reutilizada al cerrar el inventario (ECONNRESET). Salud inmediata 200, servidor activo y siete sesiones conservadas. Hubo seis reintentos de sincronizacion y respuestas de hasta 7,34 segundos. Evidencia: PRIORIDADES-VOLUMEN-RETEST-20261024-results.json.
- Diagnostico de conexion: el simulador lee y compara la copia completa de forma sincronica entre solicitudes, lo que puede dejar vencer conexiones. Se elimina la lectura repetida del mismo archivo en la comparacion, sin quitar ninguna asercion. No se modifica la configuracion HTTP de produccion.
- Ensayo abreviado con conexiones nuevas: fallo una comparacion por normalizacion de metadatos de pedidos ficticios recien creados (numero de armado y campo action de la traza), no por importes ni movimientos duplicados. Evidencia: PRIORIDADES-CONEXIONES-20261024-results.json. Se repite la secuencia completa de inventario y sus mismas aserciones en PRIORIDADES-CIRCUITO-20261024-results.json; los resultados fallidos no se eliminan.
- Secuencia completa final APROBADA: PRIORIDADES-CIRCUITO-20261024-results.json. Copia de 98 MB, Node 18, siete usuarios, ventas/cobros/conteo concurrentes, referencias por producto, reintentos idempotentes, cierre, comparaciones estrictas y equivalencia de sincronizacion por rol. Conexiones nuevas, cero reintentos por saturacion en esta corrida. El archivo fuente conserva su hash.
- Memoria del servidor aislado: pico RSS 672,9 MiB, pico heap 328,8 MiB; final RSS 351,3 MiB y heap 151,8 MiB. No son metricas del servidor productivo. Referencia de conteo 6-31 ms; guardado actual alrededor de 1,93 s; autorizaciones concurrentes 2,99-3,18 s. Se midieron otros guardados de hasta 5,90 s y carga completa de hasta 10,01 s.
- El ensayo final no reproduce el ECONNRESET con conexiones nuevas, pero no demuestra que las conexiones reutilizadas reales esten libres de ese riesgo. La normalizacion de metadatos de pedidos recien creados en ingresos comunes tambien queda documentada; no se quita la comparacion para esconderla.
- Estos ensayos no son una medicion de usuarios reales ni una garantia de ausencia de incidentes. La primera carga y las esperas de sincronizacion siguen siendo un punto de rendimiento a resolver antes de prometer fluidez en produccion.

## Comprobacion manual en demo

Demo local aislada: http://127.0.0.1:25934/#control-stock.
Usuario ficticio admin1, clave SmokeTest2026! Solo para esta demo; no son credenciales de produccion.
Proceso de la demo 2340. Datos en carpeta temporal propia, sin conexion al servicio publico.

1. Iniciar inventario y comprobar que la referencia inicial no cambia al recibir mercaderia.
2. Comenzar el conteo de un producto; guardar una cantidad distinta. Verificar que guardar aun no modifica el stock.
3. Autorizar una sola vez y comprobar diferencia, motivo, usuario y trazabilidad. Reintentar no debe agregar otro movimiento.
4. Con movimiento durante el conteo: rechazar la referencia anterior y repetir. Con movimiento despues de guardar: conservarlo al ajustar.
5. Corregir una transferencia pendiente de 1000 por efectivo de 900: deuda final 100, cierre original igual y transferencia anterior no validable.
6. Comparar efectivo por ruta con los cobros en efectivo, excluyendo transferencias, y revisar gastos/correcciones separados.
7. Exportar Estadisticas y sumar columnas numericas en Excel; comprobar costo historico, devoluciones y productos sin costo marcado.

Capturas reales de la demo (datos ficticios): STOCK-CONTEO-producto-en-curso-20261024.png, PRIORIDADES-cobranza-preview-20261024.png, PRIORIDADES-efectivo-20261024.png y PRIORIDADES-estadisticas-20261024.png.

## Antes de publicar

La continuacion de carga/conexiones, nuevas pruebas y puerta de despliegue estan
documentadas en PERF-187-20261024.md. Los resultados fallidos anteriores se
conservan como antecedentes, no como la aprobacion de la version final.

- Verificar resultado de carga y revisar tiempos/esperas, no solo aprobacion funcional.
- Revision de diff: excluir archivos/documentos ajenos a este paquete.
- Versionar recursos y cache; actualizar integridad para los archivos modificados.
- Respaldo y hashes de datos/usuarios antes de despliegue; ventana y reinicio autorizados.
- Publicar codigo, nunca la copia de pruebas. Verificar salud, sesiones, integridad y datos tras el reinicio.
- Comprobar un primer conteo real aprobado y la cobranza identificada, sin operaciones ficticias en produccion.
