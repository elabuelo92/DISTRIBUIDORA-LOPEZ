# Persistencia del estado - diagnostico y proximo cambio

## Situacion actual

`server.js` guarda el estado completo en un JSON temporal y lo renombra antes
de responder a la operacion. Es una confirmacion posterior a la persistencia:
no debe sustituirse por un guardado diferido que responda OK primero.

En la simulacion aislada con 10 pedidos y un estado de aproximadamente 47 MB,
44 escrituras promediaron 239 ms. La ultima escritura midio 99 ms de
serializacion y 164 ms de disco; el retardo p95 del event loop fue 284 ms.
Son mediciones locales y no describen necesariamente el disco de Vultr.

`node scripts/benchmark-state-write.js data/demo-state.json 5` mide sin tocar
el archivo de entrada. Usa copias temporales y verifica su SHA-256. Con el
estado local de 13,7 MB, la mediana fue 65,7 ms para serializar y 19,4 ms
para escritura atomica sincrona. La variante asincrona no redujo el tiempo
total de confirmacion; cambiar a ella sin coordinar las mutaciones podria
introducir carreras o confirmar pedidos antes de guardarlos.

La simulacion posterior de 100 pedidos, 100 etiquetas y 100 pedidos
planificados termino sin errores ni timeouts y sin escrituras productivas.
En las ultimas 64 escrituras sinteticas el p95 fue 155 ms de serializacion y
210 ms de disco. El test de 45 segundos anterior solo alcanzo 95 pedidos;
se repitio con 120 segundos y completo los 100.

El estado local usado en esa medicion contiene 3.418 entradas de auditoria y
3.000 eventos. No extrapolar esos tamanos a produccion: las escrituras
actuales limitan las colecciones recientes. No borrar ni recortar registros
historicos como atajo de rendimiento.

## Instrumentacion agregada

`/api/admin/performance` y el monitor administrativo muestran p95 de las
ultimas 64 escrituras, separado en serializacion y disco. El Monitor presenta
las tres cifras con su numero de muestras, o `Sin muestras` al arrancar.
Conservan las metricas previas de cantidad, promedio, maximo, bytes y ultimo
guardado. Esta instrumentacion no cambia el algoritmo de persistencia.

## Medicion productiva sin pedidos de prueba

Despues de un despliegue autorizado de `8790-152`, validar respaldo,
`/api/health`, version, licencia, integridad y conteo de pedidos antes de
medir. Una pasada del benchmark en Vultr lee el estado productivo, escribe
solo copias temporales y comprueba que el hash de origen no cambie:

```sh
node scripts/benchmark-state-write.js /opt/distribuidora-lopez/data/demo-state.json 1
```

Verificar primero espacio libre en `/tmp` y detener la prueba si el host ya
esta bajo carga. La cifra de disco corresponde al filesystem temporal, no
necesariamente al del archivo operativo. No ejecutar una simulacion que
cree pedidos en produccion. El p95 del Monitor empieza `Sin muestras` tras
el reinicio y se vuelve representativo solo luego de suficientes escrituras
reales; no interpretarlo como cero latencia.

## Criterio para la mejora estructural

La reduccion sustancial exige que crear o actualizar un pedido no vuelva a
serializar todas las carteras, rutas, historiales y productos. Migrar por
dominio a almacenamiento transaccional, empezando por pedidos y sus lineas,
con una clave de idempotencia y transacciones para stock/cobranza. Antes del
cambio productivo:

1. Capturar respaldo y probar restauracion en una copia aislada.
2. Comparar conteos, IDs, importes, lineas, stock y rutas entre JSON y la
   base transaccional; ninguna diferencia silenciosa.
3. Ejecutar simultaneidad de vendedores, administracion y reparto con 100 y
   200 pedidos; medir p50/p95, errores, duplicados y retardo del event loop.
4. Preparar lectura reversible al estado anterior sin descartar los pedidos
   escritos durante la prueba; no activar doble escritura sin reconciliacion.
5. Desplegar solo despues de un corte controlado, con validacion de pedidos
   reales y monitoreo posterior.

Meta de aceptacion: ninguna venta confirmada se pierde o duplica; no hay
regresiones en stock, armado, despacho ni cobranza. Informar mejora real
antes/despues con la misma carga y el mismo servidor. No prometer 10x sin
medicion.

## Estado

Instrumentacion, vista de Monitor y benchmark implementados localmente para
`8790-152`. La persistencia productiva continua sin cambios hasta despliegue
autorizado; la migracion transaccional no esta hecha.
