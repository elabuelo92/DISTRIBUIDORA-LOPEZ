# Sincronizacion 163: diagnostico y validacion

Estado: candidato local. Despliegue condicionado a pruebas finales y ventana autorizada.

## Cuello de botella

La ruta critica observada es GET /api/state durante escrituras del estado completo.
En la base productiva, la inspeccion de solo lectura encontro 711 pedidos activos,
309 archivados y 1315 clientes. Los mayores bloques serializados son pedidos
(13.3 MB), movimientos de stock (5.1 MB), auditoria de pedidos (4.5 MB), pedidos
archivados (4.3 MB) y auditoria global (2.3 MB). Son aproximaciones JSON,
no mediciones de transferencia comprimida. No se descargaron registros personales.

En la simulacion anterior: 333 escrituras de un estado de 44 a 57 MB, promedio
407 ms por escritura, p95 667 ms. La lectura administrativa llego a 14696 ms.
El limite de cuatro respuestas completas rechazaba las solicitudes adicionales.
No se atribuye todo el tiempo a disco: tambien hay serializacion, compresion,
espera por el bucle principal, transferencia y decodificacion del cliente.

## Cambios acotados

- GET /api/state ofrece sections-v1 solo si el cliente lo solicita. La primera
  carga es completa; las posteriores comparan huellas SHA-256 de las secciones
  ya filtradas por permisos. Se envian cambios y nombres de campos eliminados.
- El frontend conserva solo huellas y version en memoria. Si su base no coincide,
  descarta el parcial y solicita una base completa. No se agrega almacenamiento
  persistente, temporizadores, endpoints ni tablas.
- Las apps anteriores siguen recibiendo la respuesta completa original.
- Se conserva el limite de cuatro transferencias. Hay una cola FIFO de hasta
  24 solicitudes por cinco segundos, cancelable al desconectarse. Saturacion o
  vencimiento conserva el 503 con Retry-After. No hay cola ilimitada.
- La respuesta se calcula con el estado vigente despues de esperar y se vuelve
  a comprobar la sesion. Se liberan los cupos tanto por finalizacion como cierre.
- La compresion de respuestas grandes usa bloques de salida de 256 KiB en lugar
  de 16 KiB para reducir callbacks al bucle principal. Contenido descomprimido
  identico; no se cambia el nivel de compresion ni el formato guardado.
- El frontend respeta Retry-After con espera acotada y variacion aleatoria.

No se cambiaron reglas de precios, cantidades, stock, cobranza ni historicos.
La persistencia completa sincrona sigue siendo una limitacion estructural;
no se afirma haberla eliminado con este cambio.

## Pruebas locales

smoke-state-sections: base completa, parcial, campos eliminados, aislamiento por
proyeccion, reconstruccion frontend y recuperacion ante base desactualizada.
smoke-state-queue: capacidad, FIFO, cierre, timeout y liberacion unica.
smoke-json-compression: gzip, deflate, sin compresion, cache y contenido identico.
smoke-sync-backoff: espera, recuperacion y sesion vencida.
smoke-seller-catalog-sync: bloqueo/aprobacion GPS con parches de pedidos.

La prueba de 100 pedidos / 20 actores de PERFORMANCE-163-SECTIONS-QUEUE.json
completo el flujo con cero errores HTTP, timeouts y rechazos de sincronizacion.
Administracion: p95 3348 ms, maximo 3912 ms. Ninguna operacion supero 5000 ms.
Todas las sesiones convergieron en 5415 ms al terminar las escrituras.
500 lineas, 100 bultos, 100 paradas unicas; stock sin diferencias e historicos
preservados. Vendido y cobrado: 874650. El guard automatico de 5000 ms se agrego
durante esa corrida; sus resultados se verificaron directamente al finalizar.

Las corridas no son una promesa de rendimiento del VPS: se ejecutan en Windows
local, 4 CPU y 14 GB RAM, con datos sinteticos, sin navegador ni GPS continuo.
## Cierre de pruebas - 29/09

Compatibilidad de carga completa: PERFORMANCE-163-LEGACY-QUEUE.json, 100 pedidos,
20 actores, cero errores y ninguna operacion superior a 5000 ms (maximo 4501 ms).

La primera corrida con 1315 clientes, 1020 pedidos historicos y GPS activo fallo
el limite de latencia: PERFORMANCE-163-VOLUME-GPS.json. No hubo errores de datos,
pero administracion alcanzo 8835 ms y crear pedido 7310 ms. No se desplego.

El perfil aislado mostro trabajo repetido de formateo de fecha/hora en los
historiales. Se reutilizan dos Intl.DateTimeFormat sin modificar los contenidos
ni la zona horaria. smoke-trace-formatters compara ambas implementaciones sobre
1020 pedidos y verifica igualdad e idempotencia. No se elimina trazabilidad.

Reprueba: PERFORMANCE-163-VOLUME-GPS-FORMATTERS.json. 100 pedidos nuevos,
20 actores (10 vendedores, 4 administradores, 4 repartidores, deposito y receptor),
1315 clientes, 1020 pedidos historicos y GPS simultaneo. Duracion total 243 s.

| Operacion | Maximo anterior ms | Maximo posterior ms | p95 posterior ms |
| --- | ---: | ---: | ---: |
| Crear pedido | 7310 | 2956 | 1981 |
| Sincronizar administracion | 8835 | 4901 | 4404 |
| Sincronizar vendedor | 7980 | 3108 | 2759 |
| Consultar reparto | 6381 | 3454 | 2102 |
| Cobrar y entregar | 5915 | 2598 | 2384 |

Las dos corridas son locales, con la misma configuracion y datos sinteticos;
la temporizacion concurrente varia. No son una garantia de tiempos del VPS.
No se afirma una mejora 10x ni la eliminacion de la persistencia monolitica.

Resultado: 100 armados, etiquetados, planificados, entregados y cobrados; 500
lineas, 100 bultos, cuatro rutas, cero diferencias de stock y total vendido =
cobrado = 874650. Historicos preservados. Cero errores HTTP, timeouts y rechazos
de sincronizacion. Las 20 sesiones convergieron, ninguna rezagada. Ninguna
operacion supero el limite de 5000 ms. El margen de administracion sigue estrecho.

Regresiones: cola HTTP con 12 solicitudes y cupo 1, catalogo de 3000 clientes
por vendedor, permisos, bloqueo GPS, cache 163, migracion de lectura, compresion,
reintentos, parciales y calculos de cuentas/inventario: OK. Manifiestos de mas
de 6000 caracteres codificados recuperan con carga completa para no exceder
limites de URL del proxy. Manifiesto productivo estimado: 4915 caracteres.

GO limitado para despliegue controlado de este candidato, con respaldo,
comparacion de pedidos, salud, licencia e integridad. Autorizacion excepcional
expresa del usuario para terminar esta noche despues de medianoche. No se
autorizan pruebas destructivas ni carga sintetica sobre produccion.

Pendiente estructural: reemplazar escrituras completas sincronas por persistencia
incremental con garantias de durabilidad, concurrencia y recuperacion. Requiere
una fase separada; no se improvisa junto al despliegue. Validacion en navegadores
productivos y uso real no queda sustituida por esta simulacion HTTP local.
