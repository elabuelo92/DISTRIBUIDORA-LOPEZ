# Prompt 142 - Abastecimiento exclusivamente manual

Estado: pruebas locales aprobadas; despliegue 8790-188 y reinicio autorizados,
pendientes de ejecucion y verificacion. Base productiva comprobada: 297df1d,
version 8790-187.
El usuario habia indicado "Dejar preparado por ahora"; su nueva instruccion
"Desplegado y reinicia" del 24/10/2026 autoriza publicar P142 con respaldo.

## Causa

`openSupplyPlannerIfPending` calculaba faltantes y, si habia alguno y el usuario
era administrador, programaba `showModal()` a los 120 ms. Se llamaba despues de
guardar una ficha de producto y en el manejador antiguo de ingreso manual.
No provenia de React/useEffect. Las llamadas eran consecuencia de guardar/cambiar
estado; el temporizador podia mostrar el informe despues de otra accion.

`renderStockSupply` tambien generaba la tabla detallada del modal cerrado.
Una seccion previamente elegida podia procesarse fuera de Stock mediante un
render general. No se encontraron solicitudes dedicadas a una API de abastecimiento
ni listeners duplicados del boton: el informe usa el estado ya sincronizado.

## Cambios

- `app.js`: quitar ambos disparadores y la funcion con el temporizador de 120 ms.
- Abrir solo desde el listener unico de `openSupplyPlannerBtn`, conservando la
  restriccion administrativa. Una segunda activacion con el modal abierto no
  repite apertura ni calculo.
- El modal cerrado no construye resumen ni tabla. La seccion de Abastecimiento
  solo se procesa cuando esta seleccionada y Stock es la vista activa.
- Al consultar manualmente se usan los datos actuales. Si se actualiza la
  seccion con el modal abierto, se reutiliza su lista de faltantes.
- No se modificaron los calculos de backend, `buildShortageList`, asignacion de reservas,
  calculos de stock, sincronizacion global, pedidos, saldos ni movimientos.
- `scripts/smoke-v25.ps1`: marcador historico actualizado para esperar apertura
  manual y conservar la autoasignacion de mercaderia. El resto del script sigue
  siendo una prueba historica de v25; no se ejecuto contra produccion.

## Pruebas y evidencia

- `smoke-supply-manual-p142.js`: apertura solo manual, un listener, ausencia de
  timers/API, informe oculto sin calculo, datos frescos al reabrir, permisos y
  faltantes preservados. PASS con Node 18.
- `smoke-stock-count-http.js --supply-visual`: servidor temporal, datos ficticios,
  navegador real y escrituras solo en ese servidor. Stock, busqueda, editar/guardar,
  salir/volver, actualizar stock por API y consulta manual. Capturas desktop/movil.
  Reporte: `P142-abastecimiento-results.json`.
- `smoke-inventory-finance-workspaces.js`: navegacion por herramientas y
  equivalencia de calculos. PASS.
- `smoke-stock-reconciliation.js` y `smoke-stock-cut.js`: PASS.
- HTTP `--multi --cut --current --records`: PASS, tres administradores, dos
  vendedores y dos repartidores. Un ajuste por reintento, reservas/saldos y
  sesiones conservados. Reporte: `P142-stock-regression-results.json`.
- Sintaxis de app y tres archivos de pruebas verificada con Node 18.
- Capturas: `P142-abastecimiento-manual.png` y `P142-abastecimiento-movil.png`.

La prueba inicial usaba una reserva ficticia de B sin pedido que la respaldara.
Se completo el fixture con su pedido y campos vacios normalizados; no se altero
el motor para hacer pasar la prueba. Los datos reales nunca se usaron.

## Hallazgo separado, no corregido en P142

El boton antiguo `manualStockBtn` esta oculto en `index.html`. Al forzar su evento
en la copia aislada, el ingreso llego al servidor pero el manejador fallo con
`Cannot read properties of null (reading 'reset')`: usa `event.currentTarget`
despues de un `await`. Esto ya existia en la base 187 y no es la apertura automatica.
No se habilito el boton ni se considero aprobada esa interfaz antigua. La prueba
final usa la API local para simular el cambio de stock y comprobar el refresco.
Debe tratarse aparte; no reintentar ciegamente ese formulario porque el ingreso
puede haber sido aplicado antes del error.

## Publicacion pendiente

Durante el desarrollo de P142 no hubo acceso ni escritura a produccion.
Luego de la nueva autorizacion, inspeccion en modo lectura a las 18:22 ART:
version 8790-187, PID 3334787, cinco sesiones, integridad 28/28, mantenimiento
inactivo y cero rechazos de sincronizacion acumulados. P142 aun no incluido.

Paquete preparado: version 8790-188 en config/runtime, index y service worker;
sin cambios de reglas de negocio ni migraciones. Helper de despliegue probado
sin conexion: exige commit exacto, base 297df1d, fecha 24/10, respaldo verificado,
recuperacion ante errores y hashes identicos de datos/usuarios antes de habilitar.
Se repitieron seis regresiones (P142, conciliacion, corte, conteo actual, cache,
primer service worker), seis revisiones de sintaxis y las guardas de deploy
187/188. Se repite tambien la prueba visual con assets versionados.

Respaldo local de los archivos base (no de los datos productivos):
`C:/DistribuidoraLopez/.security/P142-base-8790-187-297df1d.zip`.
Contiene app, index, styles, service worker, config, server y order-engine del
commit 297df1d. Lectura del ZIP y presencia del codigo anterior verificadas.
SHA256: `BA69AC6B12FFCE934BC2ACFDBF193EBCCC086DB00CAD33DFB610F85F96E1B6EC`.

Antes de una publicacion autorizada: respaldo de datos y codigo productivos,
revision del diff, versionado de assets/cache, integridad y validacion de los
archivos servidos. No forzar recarga ni cerrar sesiones activas. Si el procedimiento
necesita reinicio, obtener autorizacion especifica antes de ejecutarlo.
