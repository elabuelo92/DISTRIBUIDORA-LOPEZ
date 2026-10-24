# Prompt 141 - Abastecimiento / Compras pendientes

Estado: **Desplegado en produccion y validado tecnicamente: 8790-189**. Revision visual autenticada productiva pendiente; recorrido funcional aprobado en copia aislada.
Fecha: 2026-10-24. Base: 8790-188, commit 5c1083d85af976fc7531768e8c769732f08c66b3.
El desarrollo y las pruebas se realizaron en una copia aislada. El despliegue y reinicio posteriores fueron expresamente autorizados. No se crearon operaciones de prueba ni se modificaron datos de negocio productivos.

## Implementacion

- Se reutiliza la herramienta `supply` ya existente dentro de Stock e Inventario.
- Se retira el modal, su boton y su funcion de apertura. No se crea otro modulo.
- La pantalla permanente incluye producto/codigo, proveedor/rubro, faltante, transito, compra sugerida, estado y pedidos afectados.
- Cuatro indicadores resumen exactamente los productos filtrados.
- Filtros por producto/codigo, proveedor, rubro, fecha desde/hasta y estado.
- Excel real XLSX, PDF y lista imprimible conservan los filtros. Se mantienen costo y lista 2 en los informes.
- Consulta recalculada al ingresar y en las actualizaciones normales de la vista. Actualizar utiliza la sincronizacion incremental existente, con bloqueo de doble clic y sin timers nuevos.
- Busquedas y filtros de producto/proveedor/rubro/estado reutilizan el calculo de la vista, sin nuevas solicitudes. Cambiar fechas recalcula el conjunto de pedidos.
- El informe detallado no se genera cuando la herramienta esta oculta. El motor general de faltantes permanece intacto.
- Movimientos de stock siguen disponibles en su herramienta existente; se retira solo el resumen duplicado de ocho movimientos que estaba junto al antiguo resumen de abastecimiento.

## Semantica y seguridad

El calculo sigue siendo `OrderEngine.buildShortageList`: solo pedidos Pendiente con cantidades faltantes. Compra sugerida = max(0, faltante agrupado - transito), una vez por producto.

Las fechas son las de creacion del pedido, inclusivas, en America/Argentina/Buenos_Aires. Las fechas sin hora conservan su dia calendario. Pedidos sin fecha permanecen visibles sin rango y se excluyen al aplicar uno. Un rango invertido muestra error y bloquea las exportaciones.

El rango delimita los pedidos a analizar; el transito corresponde al producto, no a una reserva nueva ni a una asignacion de compras por fecha. Sin filtros, cantidades y orden coinciden con el calculo anterior.

El motor normaliza algunos campos de inventario en memoria. El informe le entrega copias superficiales de los productos para no alterar ni siquiera campos legacy durante una consulta. No se cambian formulas, logica de servidor, precios, cantidades, pedidos, reservas, movimientos, cuentas ni saldos. El servidor solo actualiza su identificador de version.

Excel e impresion conservan el permiso administrativo existente. El boton Excel permanece bloqueado hasta terminar, incluso si se cambian filtros. La exportacion usa el endpoint existente de reportes, no un endpoint de escritura de negocio. La unica ventana nueva es la de impresion, abierta expresamente por el usuario.

## Archivos

- `app.js`: herramienta, filtros, calculo de consulta, actualizacion y exportaciones.
- `index.html`: seccion permanente y retiro del dialogo.
- `styles.css`: filtros y resumen adaptados a escritorio/movil y tema oscuro.
- `scripts/smoke-supply-section-p141.js`: equivalencia, seguridad, filtros, exportacion y concurrencia de acciones.
- `scripts/smoke-supply-manual-p142.js`: conserva el punto de entrada de regresion P142 y delega al nuevo contrato sin modal.
- `scripts/supply-manual-browser-check.js`: recorrido funcional actualizado, archivos XLSX/PDF reales y capturas.
- `scripts/smoke-stock-count-http.js`: fixtures de abastecimiento y modo de demo local.
- `scripts/smoke-v25.ps1`: marcador historico actualizado; no ejecutado contra produccion.

## Pruebas ejecutadas

PASS:

1. P141 unitario: equivalencia exacta sin filtros, no mutacion de datos legacy, fechas inclusivas, transito una vez, filtros combinados, vacios, caracteres HTML, exportaciones, permisos, doble actualizacion, error de sincronizacion y doble exportacion.
2. Entrada de regresion P142: garantias anteriores sin apertura automatica.
3. Navegador aislado: 18 comprobaciones; entrar a Stock, buscar, modificar metadatos, guardar, navegar, recibir stock por API local, consultar la seccion, filtrar, actualizar, exportar e imprimir. Sin errores JavaScript.
4. XLSX descargados: cantidades/costos numericos, codigo `00170` preservado como texto, solo pedidos del rango elegido, compra cero para producto cubierto por transito.
5. PDF e impresion: archivos reales descargados/renderizados y revisados visualmente. Escritorio 1440 px, movil 390 px y modo oscuro revisados.
6. Regresion HTTP con 7 usuarios: 3 administradores, 2 vendedores y 2 repartidores; conteos y ajustes concurrentes, reintentos idempotentes, corte y referencia por producto, reservas/cuentas sin alteracion y 7 sesiones retenidas.
7. `smoke-stock-reconciliation.js`, `smoke-stock-cut.js`, `smoke-stock-current-count.js`.
8. `smoke-inventory-finance-workspaces.js`, `smoke-tabular-exports.js`, `smoke-readable-exports.js`.
9. Sintaxis de app y `git diff --check`.

La prueba de navegador hace intencionalmente una edicion de metadatos y un ingreso de una unidad en datos ficticios; verifica que sean unicos. Luego compara el estado completo antes/despues de consultas y exportaciones: identico. La prueba unitaria tambien compara el JSON completo de entrada y salida.

La primera ejecucion HTTP en el entorno restringido no pudo conectarse al servidor local. Se repitio con permiso de ejecucion local y paso. No fue un error del ERP. Poppler emitio avisos de fuentes opcionales al renderizar el PDF; genero imagenes correctamente, revisadas sin texto perdido.

Evidencias: `P141-abastecimiento-results.json`, `P141-stock-regression-results.json`, capturas `P141-abastecimiento-*.png` y archivos de prueba `P141-exports/`.

## Demo y publicacion

Demo aislada: http://127.0.0.1:23626/#stock. Usuario ficticio `admin1`, clave `LocalCountTest-Only!`. Herramienta: Abastecimiento / Compras pendientes. No usar credenciales reales. El proceso de la demo es independiente del ERP.

Publicacion y reinicio autorizados expresamente el 24/10/2026. Paquete preparado como 8790-189; recursos, cache e identificador del servidor coherentes. Inspeccion previa a las 19:24 ART: produccion 8790-188, PID 3605647, una sesion abierta, sin mantenimiento, licencia e integridad validas. 2031 pedidos, 78 rutas, 730 productos. No se realizaron operaciones de prueba en produccion.

Verificacion final de 189: navegador aislado (18 comprobaciones) sin errores JavaScript; regresion con 7 usuarios y `DL_MAX_FULL_STATE_RESPONSES=1`, igual al limite productivo, aprobada. Pruebas de cache, primera instalacion, sintaxis y simulacion de despliegue 189 aprobadas. La simulacion valida commit/base/fecha, respaldo verificado, recuperacion, comparacion SHA256 completa de datos/usuarios y salud antes de retirar mantenimiento.

## Despliegue verificado

- Publicado el 24/10/2026; reinicio completado aproximadamente a las 19:35 ART.
- Commit productivo: `b19b5c1b5d7a4191421c0f859731ca195c65551c`.
- Respaldo verificado: `/opt/distribuidora-lopez/backups/emergency-20261024-223405`, con `app.tar.gz`, `data.tar.gz`, entorno, manifiesto y comparacion de pedidos.
- Servicio ERP activo, PID anterior `3605647`, nuevo `3627093`. No se reiniciaron otros servicios.
- Mantenimiento desactivado; version publica y privada `8790-189`; licencia valida e integridad 28/28. Limite de sincronizacion conservado en 1.
- `demo-state.json` identico antes/despues: SHA256 `5cfb0dc1d927358242ceaa0d8540454f6874c1751b2591a7fe1a99dc0003137f`.
- `users.json` identico antes/despues: SHA256 `93033881d6193e2cdfe634afb302a07eedbdd187cf734c26e15b874c71e68162`.
- Comparacion de pedidos: cero faltantes, agregados o cambios; 2031 pedidos, 78 rutas, 730 productos. Version de datos `1792868869519` conservada. Esto incluye reservas, stock y saldos del estado completo.
- Recursos publicos `index.html`, `app.js`, `styles.css`, `sw.js`: SHA256 identicos al commit probado, HTTP 200 y sin cache obsoleta. Configuracion dinamica del servidor verificada en 189.
- La primera comprobacion de recursos quiso comparar `config.js` contra el archivo del repositorio; se corrigio esa comprobacion porque el servidor lo genera desde su entorno. No era una discrepancia del despliegue. No se cambio codigo productivo por esa prueba.
- Evidencia publica: `P141-production-assets-189-results.json`. Log completo local: `C:\DistribuidoraLopez\.security\P141-deploy-189-20261024.log`.
- La unica sesion previa se cerro por el reinicio autorizado. Falta el ingreso humano para la revision visual productiva; no se usaron credenciales ni se simularon operaciones reales. Las 18 comprobaciones funcionales de navegador se hicieron en aislamiento.

## Checklist de aceptacion

- [x] Entrar a Stock, buscar, editar y guardar sin ventanas de abastecimiento.
- [x] Cambiar de modulo/herramienta y volver sin popup.
- [x] Consultar manualmente una sola seccion con los mismos faltantes del motor.
- [x] Probar filtros, rango de fechas, rango invalido y cero resultados.
- [x] Verificar Excel, PDF e impresion con los mismos pedidos filtrados.
- [x] Actualizar una vez, sin solicitudes duplicadas ni escrituras de negocio.
- [x] Confirmar calculo actualizado al volver a entrar y vista oculta sin trabajo de informe.
- [x] Preservar datos, reservas y saldos en pruebas aisladas.
- [x] Publicar con respaldo, comparar datos completos y comprobar salud/recursos publicos.
- [ ] Revisar con sesion administrativa real, sin crear operaciones de prueba en produccion.
