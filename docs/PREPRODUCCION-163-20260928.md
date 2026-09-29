# Preproduccion 163 - 28/09/2026 ART

## Decision

NO-GO para aprobar fluidez con todos los usuarios activos. Despliegue retenido;
produccion permanece en 8790-162. No se reinicio ni escribieron datos productivos.
Se solicito confirmacion separada para publicar solo las mejoras de pantallas,
con conocimiento del riesgo de sincronizacion que estas no resuelven.
No se genero respaldo nuevo porque no se inicio la intervencion productiva.

## Produccion inspeccionada

Servicio activo, 709 pedidos, 24 rutas, 716 productos. Licencia e integridad OK.
Una sesion activa, cero sincronizaciones rechazadas desde el inicio del servicio.
Limite de sincronizaciones completas: 4. Memoria disponible aproximada: 2.5 GiB.
Usuarios habilitados consultados sin extraer credenciales: 4 administradores,
10 vendedores, 4 repartidores, 1 receptor y 1 deposito. Total: 20.
La salud en baja carga no demuestra capacidad durante la jornada.

Revalidacion final 28/09 23:23 ART: misma version 162 y mismo PID 1455520,
servicio sano, licencia/integridad OK, 2 sesiones, cero rechazos desde el arranque,
711 pedidos, 24 rutas y 716 productos. El conteo aumento durante la operacion
ajena a las pruebas; no se atribuye a una restauracion ni a escrituras de esta tarea.

## Prueba aislada de 20 usuarios

Windows local, 4 CPU logicas, Node 24.16.0; no equivale al VPS de 2 vCPU.
Datos ficticios: 300 clientes, 711 productos, 254 pedidos historicos y 100 nuevos.
Estado sintetico inicial 44.3 MB, final 57.0 MB. Limite de lecturas: 4, como produccion.
120 segundos de ingresos, 183 segundos totales hasta completar operaciones.
Todos los roles autenticados y leyendo simultaneamente; 5 rutas distribuidas
entre los cuatro repartidores. Las entregas se realizan secuencialmente por ruta.
Recepcion participa como lector, no se simula ingreso de remitos.
Se fuerzan lecturas completas version=0 cada 5 segundos: prueba extrema, no una
reproduccion exacta de las versiones/reintentos del navegador. No mide render ni
GPS continuo, redes celulares, impresoras fisicas ni el resto de servicios del VPS.

| Operacion | p95 ms | Max ms | Errores HTTP |
| --- | ---: | ---: | ---: |
| Crear pedido | 3042 | 3935 | 0 |
| Clientes | 2238 | 3204 | 0 |
| Armado batch | 2321 | 2321 | 0 |
| Etiquetas batch | 2679 | 2679 | 0 |
| Listo despacho | 1690 | 1690 | 0 |
| Publicar ruta | 3124 | 3124 | 0 |
| Cobrar y entregar | 2596 | 3104 | 0 |
| Sincronizacion administracion | 16073 | 20221 | 17 |
| Sincronizacion vendedores | 2398 | 4973 | 141 |
| Sincronizacion deposito | 3494 | 4786 | 14 |
| Sincronizacion recepcion | 12381 | 12381 | 7 |
| Lectura reparto | 2820 | 3511 | 0 |

179 rechazos temporales de sincronizacion completa. Los percentiles incluyen
respuestas rechazadas; no son latencias exclusivamente de respuestas exitosas.
Sin timeouts. La aplicacion reconoce X-State-Sync-Busy y conserva la sesion;
no se verifico aqui la convergencia posterior de sus reintentos reales.

100 pedidos creados, armados, etiquetados, planificados, entregados y cobrados.
500 lineas, 100 bultos, 100 paradas unicas, sin duplicados ni diferencias de stock.
Vendido y cobrado: 874650. Historicos, clientes y productos preservados.
Escritura completa: 297 escrituras, promedio 410 ms, p95 ultimas 64 muestras 574 ms;
serializacion p95 239 ms y disco p95 349 ms (percentiles no aditivos).

Primera corrida con 16 usuarios: tambien completo 100 pedidos sin diferencias,
pero registro 204 rechazos y lectura administrativa maxima de 10025 ms.
Ese informe conserva la etiqueta antigua 8790-158-simulation del guion;
se ejecuto con el codigo local de esta tanda. La segunda corrida ya identifica 163.

Evidencia: PERFORMANCE-163-CONCURRENCY.json y PERFORMANCE-163-20-USERS.json.
Los procesos de prueba finalizaron y limpiaron sus directorios temporales.

## Mejoras verificadas

Herramientas modulares y calculos locales: smoke-inventory-finance-workspaces OK,
resultados equivalentes sin mutacion. Cuentas consolidadas, proveedores/precios,
carga selectiva del tablero y actualizacion de cache 163: OK. Sintaxis y diff: OK.
No se modificaron reglas de escritura del backend ni limites de concurrencia.

## Accion pendiente y contingencia

Prioridad: reducir el estado transferido y las escrituras completas; verificar
versiones/reintentos/convergencia y aislamiento por rol antes de cambiar ese flujo.
No incrementar concurrencia ni reiniciar automaticamente por CPU sin mediciones.
Ante demoras: comprobar si el pedido o cobro ya se guardo antes de repetir;
evitar recargas simultaneas y no borrar almacenamiento con pedidos sin sincronizar.
No corresponde prometer ausencia de incidentes para la proxima jornada.

## Reprueba con versiones y recuperacion - 28/09 23:34 ART

Resultado: NO-GO. Implementado localmente, pendiente de despliegue.

Informe: PERFORMANCE-163-REALISTIC-RETEST.json. Ejecucion aislada de 239 s,
20 actores (10 vendedores, 4 administradores, 4 repartidores, deposito y receptor),
100 pedidos y estado sintetico de 44.3 MB iniciales a 57 MB finales.
Lecturas con versiones, intervalos de 10/15 s y espera tras servidor ocupado.
No es una prueba de navegadores/APK ni una medicion del VPS: Windows local,
4 CPU y 14 GB de RAM; no permite prometer capacidad productiva equivalente.

Los 100 pedidos completaron armado, etiquetas, rutas, entrega y cobro.
500 lineas, 100 bultos, 100 paradas unicas, sin diferencias de stock.
Historicos preservados. Vendido y cobrado: 874650. Cero timeouts y errores
en operaciones de escritura. Hubo 50 respuestas 503 de sincronizacion:
38 vendedores, 8 administracion, 3 deposito, 1 receptor.

Tiempos p95 / maximo en ms:
- Crear pedido: 1928 / 3243.
- Etiquetas: 1280 / 1381.
- Publicar ruta: 1380 / 1380.
- Cobrar: 1887 / 3484.
- Lectura administrativa: 12420 / 14696.
Los percentiles de lectura incluyen respuestas rechazadas.

Tras cesar las escrituras, los 20 actores alcanzaron la version final en
6289 ms, sin usuarios rezagados ni tareas fallidas. Esta recuperacion no elimina
el problema de latencia durante la carga. Las corridas anteriores tienen patrones
de consulta distintos: no atribuir sus diferencias a una mejora del servidor.

Proteccion local agregada: pullStateFromServer respeta Retry-After (espera
acotada de 1 a 60 segundos mas jitter) y evita llamadas anticipadas; conserva
sesion y estado ante 503. Sin nuevos temporizadores ni reintentos de escrituras.
smoke-sync-backoff verifica espera, recuperacion, preservacion de sesion y 401.
Sintaxis app/simulador y git diff --check: OK.
El simulador ahora exige convergencia para aprobar; ese guard adicional se agrego
durante esta corrida y no fue ejecutado por ella. El resultado ya es NO-GO por
los 50 rechazos; la convergencia se verifico tambien directamente en el informe.

Produccion consultada sin cambios a las 23:32 ART: v8790-162, PID 1455520,
servicio activo, salud publica/local e integridad OK, 2 sesiones, cero rechazos
de sincronizacion desde su arranque. Sin reinicio, despliegue ni escrituras de
prueba sobre produccion. La simulacion finalizo y elimino sus temporales.

## Cierre posterior - 29/09 00:15 ART

Se completo la correccion de sincronizacion y formateo repetido de historiales.
El reporte SINCRONIZACION-163-20260928.md documenta las corridas fallidas y la
reprueba aprobada de 100 pedidos, 20 actores y GPS con volumen equivalente.
PERFORMANCE-163-VOLUME-GPS-FORMATTERS.json: cero errores, integridad OK y maximo
4901 ms. Compatibilidad de apps anteriores y regresiones funcionales: OK.
GO para despliegue controlado con respaldo; autorizado expresamente por el
usuario para completar esta noche aun despues de medianoche. Hasta que exista
reporte de despliegue y verificacion remota, los cambios siguen siendo locales.
