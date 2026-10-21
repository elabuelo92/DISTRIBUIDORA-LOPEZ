# Sincronizacion y operaciones concurrentes: ensayo local

Fecha: 2026-10-21. Produccion: sin acceso, cambios ni reinicios.
Codigo base 8790-182 con cambio local de gzip a Z_BEST_SPEED.

## Cambios

- Compresion gzip de nivel 6 predeterminado a nivel 1. No se modifica el
  contenido JSON, permisos, reglas contables ni datos historicos.
- Ensayo HTTP con tres administradores, dos vendedores y dos repartidores.
- Sonda de memoria precargada exclusivamente en el servidor temporal.
  Registra cada 250 ms y recoge el maximo RSS acumulado del proceso.
- Copia fuente local de 90.112.718 bytes; su SHA-256 se compara al terminar.
  Servidor ligado a localhost con directorio temporal, usuarios ficticios y
  heap limitado a 512 MiB. El heap no representa toda la memoria del proceso.

## Pruebas

PASS en copia pequena y grande: conteos repetidos, confirmaciones repetidas,
conteos en conflicto, reserva minima, permisos, clave incorrecta, una venta
y un cobro mixto simultaneos con stock y sincronizaciones. Se reenvian la
venta y el cobro para comprobar idempotencia.

- Una sola venta; reserva del producto B exactamente dos unidades.
- Reserva previa del producto A conservada en diez unidades.
- Un solo cobro, dos comprobantes y saldo esperado de 600: efectivo 400,
  transferencias pendientes 500 y cuenta corriente 100 sobre un total 1000.
- Pedidos historicos y movimientos de cuentas preexistentes comparados
  completos, sin cambios. Cuentas de proveedores sin cambios.
- Siete sesiones conservadas, sin caida del servidor temporal.
- Siete suites de regresion de stock/sincronizacion: PASS.

Una primera ejecucion grande fallo por una asercion del test que buscaba
movimientos historicos mediante un ID ausente. Se cambio a comparar el
conjunto completo conservando su orden; la repeticion completa paso.

## Mediciones

| Medida | Resultado |
| --- | --- |
| Compresion aislada nivel 6 | 1183 ms; 7.631.546 bytes |
| Compresion aislada nivel 1 | 469 ms; 10.405.339 bytes |
| Descompresion comparada con original | Identica en ambos casos |
| Lectura completa HTTP maxima | 6846 ms |
| Registro de conteo maximo | 4101 ms |
| Confirmacion de conteo maxima | 1330 ms |
| Venta maxima | 3997 ms |
| Cobro maximo | 3999 ms |
| Maximo RSS acumulado del proceso | 689404 KiB (673 MiB) |
| Maximo heap observado por muestreo | 312434768 bytes (298 MiB) |
| RSS en ultima muestra | 282284032 bytes (269 MiB) |

La compresion consume aproximadamente 60% menos tiempo, pero envia 36%
mas bytes. No implica 60% de mejora HTTP ni garantiza mejora en redes
moviles lentas. Los tiempos corresponden al equipo local, Node v24.16.0.
El muestreo periodico puede omitir picos durante bloqueos del event loop;
por eso se informa tambien el maximo acumulado proporcionado por el SO.

## Limitaciones y proximo foco

No es una simulacion de toda una jornada ni una prueba visual movil. Los
repartidores y vendedores adicionales consultan estado; hay un vendedor
creando una venta y un repartidor cobrando. La prueba usa la respuesta
completa de /api/state, no reconstruccion incremental sections-v1 del navegador.
No afirma conservar todas las reservas del catalogo: comprueba A, B y los
pedidos historicos. No prueba validacion bancaria posterior en este escenario.

La copia contiene 40,9 MB de pedidos, 10,9 MB de movimientos de stock,
8,3 MB de rutas y 8 MB de auditoria de pedidos. La compresion por si sola
no resuelve la serializacion, persistencia y transferencia del estado grande.
Hace falta perfilar y probar el protocolo incremental real y las escrituras
del estado completo antes de proponer un despliegue para resolver la lentitud.

Estado: implementado y probado localmente; no desplegado. Integridad del
escenario: PASS. Fluidez global: pendiente, con lecturas superiores a 5 s.

Evidencia: STOCK-MULTIUSER-20261021-results.json y
STOCK-MEMORIA-20261021-results.json.
