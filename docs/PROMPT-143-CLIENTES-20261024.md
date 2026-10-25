# P143 - Edicion segura de clientes / version 8790-190

Estado: implementado localmente; despliegue autorizado, sujeto a pruebas finales y respaldo.
Paquete: correccion de Clientes + tres accesos de Stock autorizados expresamente.

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

- Base ficticia de 2500 clientes/3000 pedidos: antes 343-448 ms para API + recarga de listado. Primera prueba posterior: API 209-272 ms; pantalla 450 ms escritorio / 306 ms en emulacion movil. Sin consulta adicional del listado al guardar.
- Copia historica local de aproximadamente 98 MB: antes 2,4-3,4 s; primera prueba posterior 2,1-3,0 s. Mediana aproximada: 2,94 s -> 2,22 s. Persistir el archivo completo sigue dominando el tiempo.
- El usuario autorizo publicar estas correcciones y continuar despues con el objetivo inferior a 1 s. No se presenta ese objetivo como alcanzado ni estos tiempos locales como mediciones productivas.
- Resultados finales reproducibles y fases de autenticacion, serializacion y disco en `P143-before-results.json`, `P143-after-results.json`, `P143-volume-before-results.json` y `P143-volume-after-results.json`.
- Repeticion final: base ficticia 219-283 ms de API, pantalla 351/317 ms; copia grande 1,95-2,43 s, mediana 2,20 s (25% menos que los 2,94 s anteriores). Las 14 verificaciones de publicacion pasaron.

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

## Checklist del cliente

1. Clientes: editar solo telefono y confirmar con la clave administrativa en el modal separado.
2. Reabrir: comprobar telefono nuevo, email igual y GPS/saldo/vendedor/ruta sin cambios.
3. Guardar sin email; luego probar un email valido y comprobar que `Admin2` no se acepta.
4. Chrome: elegir la clave guardada; verificar que corresponde al usuario del modal, no al email del cliente.
5. Android: abrir Clientes y repetir la edicion; ante error, verificar que lo escrito se conserva.
6. Stock: recorrer Existencias, Control fisico y Abastecimiento. El informe solo se consulta manualmente; filtros, Actualizar, Excel, PDF e impresion siguen disponibles.
