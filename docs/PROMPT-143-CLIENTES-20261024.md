# P143 - Edicion segura de clientes / version 8790-190

Estado: **Desplegado en produccion y validado tecnicamente: 8790-190**.
Paquete: correccion de Clientes + tres accesos de Stock autorizados expresamente.
Publicacion: 24/10/2026, 21:21 ART. Verificacion publica completada a las 21:24 ART.
Pendiente: prueba manual con contrasena guardada en Chrome y Android fisico; guardado inferior a 1 s en la base grande.

## Diagnostico

- El formulario comercial incluia el email opcional junto con un input de clave marcado `autocomplete=current-password`. No existia un usuario de autenticacion separado. Esa estructura favorecia que el gestor de contrasenas tratara el email comercial como usuario de acceso.
- El guardado anterior enviaba toda la ficha, reconstruia valores por defecto, ejecutaba `accountEngine.migrateState` sobre el estado completo, solicitaba sincronizacion y forzaba otra consulta del listado de clientes.
- La persistencia de este circuito es JSON con reemplazo atomico del archivo, no SQL. Consultas SQL: cero. No hubo migracion de datos.
- Diagnostico productivo exclusivamente de lectura a las 20:28 ART del 24/10: 1645 clientes, cero emails no vacios, cero coincidencias con usuarios administrativos. No se modifico ningun registro. Evidencia: `P143-email-diagnostic-production.json`.

## Correccion

- Email comercial opcional con identificador/nombre propio, teclado de email y `autocomplete=section-customer email`; no hay claves en el formulario comercial.
- Modal independiente de autorizacion con usuario actual de solo lectura y contrasena `current-password`. Se mantienen rol administrador y comprobacion de clave. La clave se limpia al cerrar y no aparece en auditorias.
- Email validado si cambia; se permite vaciarlo. Un dato historico invalido sin editar no impide corregir otro campo ni se limpia automaticamente. El servidor rechaza usuarios administrativos como nuevo email.
- Se envian solamente campos modificados y sus valores originales. Un cambio concurrente sobre el mismo campo devuelve conflicto, sin sobrescribirlo; cambios independientes se conservan.
- Identificador idempotente por operacion: un reintento no repite historia, movimiento ni auditoria. Botones bloqueados durante el envio; errores conservan la ficha.
- Borrador aislado y escritura atomica: solo se confirma exito despues de persistir. Fallos de fsync/rename no filtran cambios sin guardar a otras sesiones.
- La respuesta actualiza el cliente y su fila sin forzar descarga de la cartera. La sincronizacion normal conserva su cursor; se descartan respuestas anteriores a la edicion confirmada.
- Auditoria de usuario, fecha/hora, IP, motivo y campos efectivamente modificados, con valores anteriores/nuevos. No se modifica el saldo desde la ficha ni el identificador del cliente.

## Tiempos y limite pendiente

- Base ficticia de 2500 clientes/3000 pedidos: antes 343-448 ms para API + recarga de listado. Ultima repeticion sobre el codigo publicado: API 202-236 ms; pantalla 293 ms escritorio / 394 ms en emulacion movil. Sin consulta adicional del listado al guardar.
- Copia historica local de aproximadamente 98 MB: antes 2,44-3,41 s; despues 1,95-2,43 s. Mediana: 2,94 s -> 2,20 s (25% menos). Persistir el archivo completo sigue dominando el tiempo.
- El usuario autorizo publicar estas correcciones y continuar despues con el objetivo inferior a 1 s. No se presenta ese objetivo como alcanzado ni estos tiempos locales como mediciones productivas.
- Resultados finales reproducibles y fases de autenticacion, serializacion y disco en `P143-before-results.json`, `P143-after-results.json`, `P143-volume-before-results.json` y `P143-volume-after-results.json`.
- Las 14 verificaciones de publicacion pasaron. La repeticion HTTP/interfaz final tambien paso sobre el codigo del commit publicado.

## Pruebas

- Email vacio/valido/invalido, telefono, direccion, zona/ruta, vendedor, observaciones y limite con centavos.
- Preservacion de todos los campos no modificados, GPS, IDs, saldos, stock, reservas, pedidos y otros clientes.
- Dos administradores; conflicto sobre el mismo campo; cambios independientes; reintento del mismo identificador; reutilizacion con otro contenido rechazada.
- Rol vendedor rechazado y clave incorrecta rechazada, sin perder lo escrito.
- Fallos de fsync y rename; archivo y cache sin cambios parciales; reintento exitoso una sola vez.
- Interfaz Chromium de escritorio y viewport tactil 390x844: separacion de formularios, corrupcion equivalente a autocompletado rechazada, error/reintento, envio de solo telefono, fila actualizada y cero recargas forzadas de cartera.
- Pendiente de comprobacion manual: gestor nativo de contrasenas de Chrome con credenciales guardadas y telefono Android fisico. La emulacion no sustituye esa comprobacion.
- Regresiones P7, horas, sincronizacion de administrador/preventa/reparto, P141/P142 y navegacion de Stock. Resumen final: `P143-release-checks.json`.

## Archivos

- `client-edit.js`: campos permitidos, comparacion, validacion y actualizacion selectiva.
- `server.js`: guardado duradero/idempotente, auditoria, respuesta compacta y contexto original de edicion.
- `app.js`, `index.html`: formularios separados, guardado por diferencias y actualizacion de fila.
- `styles.css`, `app.js`: tres accesos de Stock previamente preparados.
- `license-engine.js`, `config.js`, `sw.js`, `index.html`: integridad y version/cache de publicacion.
- `scripts/smoke-client-edit-http.js`, `client-edit-http-checks.js`, `client-edit-browser-check.js`, `client-edit-performance-probe.js`, `client-edit-baseline-server.js`, `diagnose-client-emails.js`, `verify-p143-release.js`: pruebas/mediciones aisladas.
- Pruebas actualizadas: `smoke-p7-client-edit.js`, `smoke-client-edit-validation.js`, `smoke-compact-sync-version.js`; controles de Stock en `stock-navigation-browser-check.js` y `supply-manual-browser-check.js`.
- `scripts/deploy/safe-production-deploy.py`: version 190 protegida por commit exacto, respaldo y hashes completos de datos antes/despues.

## Comprobacion del paquete anterior

Antes del despliegue se verifico en vivo: version 8790-189, commit b19b5c1, servicio activo, sin mantenimiento, licencia e integridad correctas (28 archivos). P141/P142 estaban publicados; los tres accesos visuales no. Estos ultimos se incluyen ahora con autorizacion expresa y sus pruebas de regresion.

## Despliegue y preservacion de datos

- Commit publicado: `9345c3734e9fe39269caa95f02d7e45f6be2023e`.
- Respaldo: `/opt/distribuidora-lopez/backups/emergency-20261025-002033` (nombre UTC; noche del 24/10 en Argentina).
- Reinicio controlado solamente del ERP. PID posterior `3680778`, servicio activo, `NRestarts=0` y memoria aproximada de 154 MiB en reposo. Cero sesiones activas al verificar: no representa una prueba de carga productiva.
- Salud local y publica correctas; mantenimiento desactivado; licencia valida; integridad de 29 archivos sin diferencias ni faltantes.
- SHA256 de `demo-state.json` identico antes/despues: `e336e077ca41d189afda27a73ff4f0ec577d1ac6cbb09ba7500c0392138bc6a6`.
- SHA256 de `users.json` identico antes/despues: `93033881d6193e2cdfe634afb302a07eedbdd187cf734c26e15b874c71e68162`.
- Pedidos del dia: cero faltantes, agregados o modificados por el despliegue. Se conservaron 2031 pedidos, 730 productos y 78 rutas; version de datos `1792883540272`.
- Archivos publicos `index.html`, `app.js`, `styles.css`, `sw.js` y `client-edit.js` coinciden con la fuente probada; configuracion generada por el servidor coincide con la version y conexion de salud.
- El verificador inicial confundia la marca BOM eliminada por `Response.text()` y comparaba la configuracion dinamica con el archivo local. Se corrigio solo el verificador: lectura de bytes para archivos y comparacion estructurada de configuracion. No se requirio otro despliegue ni reinicio.
- Registro del servicio desde el arranque: inicio normal, sin errores registrados al revisar. No se realizaron guardados de clientes reales como prueba ni limpiezas historicas.
- Evidencia publica reproducible: `P143-production-validation.json`, mediante `node scripts/verify-release-190.js`; log local del despliegue: `P143-production-deploy.log`.

## Checklist del cliente

Realizar sobre cambios reales aprobados, o repetir las pruebas ficticias en la copia aislada; no crear ni alterar clientes productivos solo para probar.

1. Clientes: editar solo telefono y confirmar con la clave administrativa en el modal separado.
2. Reabrir: comprobar telefono nuevo, email igual y GPS/saldo/vendedor/ruta sin cambios.
3. Guardar sin email; luego probar un email valido y comprobar que `Admin2` no se acepta.
4. Chrome: elegir la clave guardada; verificar que corresponde al usuario del modal, no al email del cliente.
5. Android: abrir Clientes y repetir la edicion; ante error, verificar que lo escrito se conserva.
6. Stock: recorrer Existencias, Control fisico y Abastecimiento. El informe solo se consulta manualmente; filtros, Actualizar, Excel, PDF e impresion siguen disponibles.
