# Corte de stock y alcance de comisiones - 22/10/2026

Estado al cierre de esta revision: correcciones implementadas localmente.
Incluidas luego en el paquete 8790-185; ver PERF-185-20261022.md y su acta de
despliegue. No se modificaron datos, reglas ni liquidaciones en la auditoria.

## Hallazgos confirmados

1. El boton Iniciar corte solo alternaba una variable de pantalla. No persistia
   una referencia. La tabla recalculaba existencias y diferencias contra stock
   vivo en cada sincronizacion. No era un corte de inventario real.
2. commissionRuleBucket permitia que una regla con producto y rubro '*' cayera
   en la rama general cuando el producto no coincidia. Tambien aceptaba nombres
   por inclusion y nombres iguales aunque el codigo fuera distinto.
3. La copia productiva descargada en solo lectura confirma la regla
   COM-1792601801021-D4DA, articulo 5048, Trapo de pisos (Blanco Premium), al 20%.
   Su snapshot aparece en 371 lineas de otros productos, en 64 pedidos y 128
   codigos distintos. Ejemplo: PED-4303, Raid Espiral x 48 (238) y Colgate 90gr
   (466). Estos conteos NO equivalen a pagos realizados ni a deuda a descontar.
4. La auditoria ampliada marca 987 lineas/434 pedidos de distintas epocas y
   reglas para revisar. Parte corresponde a reglas antiguas sin snapshot, por
   lo que no se clasifica todo ese universo como error confirmado. No se
   recalcularon importes historicos ni se determinaron reintegros.
5. No se encontraron porcentajes de linea guardados exactamente en 2.88% en
   esa copia. El resumen calcula comision/base; mezclar 1% y 3%, redondear los
   importes o mezclar vigencias puede producir ese porcentaje efectivo. Se
   reprodujo 2.88% con base 600 al 1% y 9400 al 3%. Falta identificar la pantalla
   y el caso especifico reportado por el cliente para concluir su causa exacta.

## Correccion local

- Corte persistido en servidor con ID, fecha, autor, productos, existencias y
  reservas de referencia. Un solo corte abierto; visible para otros admins.
- Cantidades de referencia fijas; stock actual separado. Las ventas y repartos
  siguen operando. No se detiene la operacion comercial.
- El conteo ingresado corresponde al momento del corte. Si se cuenta despues,
  administracion debe conciliar los movimientos fisicos de ese intervalo; no
  se puede deducir automaticamente cuando se conto cada unidad.
- Ajuste = stock actual + (conteo al corte - stock al corte). Ejemplo probado:
  referencia 100, conteo 90, despacho -15 e ingreso +7: nuevo stock 82, NO 90.
- Conteos y ajustes idempotentes, una conciliacion por producto/corte, control
  de conteo mas reciente y vista previa actual. Nunca baja reservas para hacer
  caber un ajuste. Diferencias pendientes impiden cerrar el corte.
- La sincronizacion generica no puede borrar o reemplazar cortes del servidor.
  Las apps de vendedores/reparto no descargan sus snapshots administrativos.
- Los borradores se vinculan al ID del corte. Si otro administrador cierra y
  abre uno nuevo, los borradores anteriores quedan bloqueados; se descartan
  solo con confirmacion explicita, sin trasladar cantidades al nuevo corte.
- Regla de comision por producto: codigo exacto prioritario; nombre exacto solo
  para reglas heredadas sin codigo. Un producto distinto no hereda esa regla.
- Selector y guardado rechazan productos inexistentes/ambiguos. No se altero la
  prioridad preexistente entre reglas de usuario y reglas generales.
- El resumen identifica el porcentaje efectivo promedio. El detalle agrupa
  por producto Y porcentaje registrado; no mezcla 1% y 3% bajo una falsa tasa
  individual de 2.88%. Conserva importes y snapshots historicos.

## Pruebas y limites

- 16 suites funcionales pasaron con Node 18.19.1, mismo numero de version del
  runtime productivo, en Windows local. No equivale al entorno Linux completo.
- Incluyen reglas, vigencias, liquidaciones intactas, XLSX numerico, conteos,
  reintentos concurrentes, reservas, devoluciones y fallos de fsync/rename.
- HTTP aislado: tres administradores, dos vendedores, dos repartidores;
  ajustes junto a ventas y cobros. Sesiones conservadas, un solo movimiento,
  sin alteracion de pedidos/cuentas por el ajuste.
- Capturas de escritorio y movil con Playwright y servidor Node 18. El
  navegador de prueba corre en Node 24 porque Playwright exige Node >=20.
  Paso tambien el circuito de pantalla: iniciar, recargar, guardar conteo,
  autorizar con clave y cerrar. Probado el borrador bloqueado cuando otro
  administrador cierra/abre un corte, su descarte y un nuevo conteo autorizado.
- La prueba de volumen final PASO con la copia de 98 MB, siete usuarios,
  servidor Node 18.19.1, heap de 768 MiB, sincronizacion limitada a uno y
  conexiones HTTP nuevas. Ver STOCK-CORTE-VOLUMEN-FINAL-20261022-results.json.
  Conserva pedidos/cuentas ante el ajuste y las reservas esperadas; un solo
  movimiento por ajuste y siete sesiones al terminar. El hash de la copia
  fuente quedo identico. No se modifico el archivo productivo.
- Se conservaron tres ensayos previos fallidos. El ultimo alcanzo la prueba de
  escritura generica del estado completo: reenviaba unos 98 MB por una API con
  MAX_BODY de 16 MiB que destruye la conexion al exceder el limite. El ensayo
  final no aumenta ese limite: omite explicitamente esa escritura sobredimensionada.
  La proteccion del corte contra escritura generica SI se prueba con la base
  pequena. Los otros cortes de transporte no quedan caracterizados como una
  caida productiva ni como resueltos por este paquete.
- Rendimiento: pico RSS muestreado 724 MiB y heap muestreado 534 MiB. Iniciar corte ~2,1 s,
  ajustes entre 0,13 y 5,22 s. Los conteos llegaron a 12,56 s al competir con
  un ingreso convencional que devolvio toda la base (~98 MB, 15,79 s).
  PASAR integridad funcional no implica aprobar esos tiempos ni garantizar
  estabilidad Linux con todos los usuarios. La sincronizacion/respuesta
  completa sigue siendo un riesgo pendiente, separado de estas correcciones.
- La revision productiva de las 21:25 ART vio PID 2089555 y NRestarts=0 desde
  las 17:08, una sesion activa, salud/licencia/integridad correctas y sin
  mantenimiento. No demuestra capacidad para todos los usuarios simultaneos.

## Checklist de puesta en marcha

1. Pruebas funcionales y de volumen completadas con los limites anteriores.
   Antes de afirmar solucion general de lentitud, reducir las respuestas
   completas y repetir carga realista con conexiones persistentes en Linux.
2. Revisar el alcance real de las comisiones erroneas y separar liquidaciones
   pagadas, pendientes, anulaciones y reglas vigentes. Preparar correccion
   auditada aparte; no reescribir comisiones historicas masivamente.
3. Desplegar solo despues de respaldo verificado, ventana/reinicio acordado,
   actualizacion de version e integridad y chequeo de datos antes/despues.
4. Dos admins abren el mismo corte. Una venta cambia reservas actuales pero
   no la referencia; un despacho cambia stock actual pero no el corte.
5. Guardar conteo, revisar diferencia y autorizar; repetir el envio: un ajuste,
   un movimiento, reservas y saldos intactos. Recargar y comprobar persistencia.
6. Probar articulo 5048 al 20% donde corresponda su regla; otros productos no
   deben usar ese ID. Probar nombres parecidos, iguales con distinto codigo,
   vendedor especifico, cigarrillos y vigencias.
7. Revisar resumen promedio frente al detalle por tasa y exportar Excel.

## Evidencia local

- scripts/smoke-stock-cut.js
- scripts/smoke-commission-product-isolation.js
- scripts/smoke-stock-count-http.js --multi --mixed --cut
- scripts/verify-stock-commission-20261022.js
- docs/STOCK-COMISIONES-20261022-results.json
- docs/STOCK-CORTE-VISUAL-20261022-results.json
- docs/STOCK-CORTE-VOLUMEN-20261022-results.json
- docs/STOCK-CORTE-VOLUMEN-20261022-node18-client-initial.json
- docs/STOCK-CORTE-VOLUMEN-CONEXIONES-20261022-results.json
- docs/STOCK-CORTE-VOLUMEN-FINAL-20261022-results.json
- docs/STOCK-CORTE-movimiento-20261022.png
- docs/STOCK-CORTE-ajustado-20261022.png

Copia y auditoria de datos sensibles: carpeta local .security/stock-commissions-
20261022-232724. SHA256 de origen:
ee7e516e65e8634656f91053d3b2f2df7c6648b9a43a80620c1935900a439ece.
El script audit-commission-product-scope.js no contiene operaciones de escritura
sobre el origen ni aplica correcciones.

Runtime local de prueba descargado del sitio oficial; hash SHA256 verificado
con https://nodejs.org/download/release/v18.19.1/SHASUMS256.txt. No se instalo
ni actualizo Node en produccion.
