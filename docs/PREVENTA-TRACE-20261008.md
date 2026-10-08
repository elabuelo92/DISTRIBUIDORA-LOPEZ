# Preventa: normalizacion de trazas

Alcance autorizado: evitar el recalculo de fecha y hora cuando el evento ya
contiene ambos campos. No cambia datos, reglas comerciales ni permisos.
Frontend 8790-168-r20261008a; backend conserva 8790-168.

Pruebas locales: 18 casos de regresion; 1466 pedidos y 13280 eventos de la copia
del 7 de octubre comparados campo por campo, sin diferencias. Tres ejecuciones
de normalizacion: antes 3997/3780/4079 ms; despues 216/128/147 ms.
Son tiempos del procesamiento aislado en PC, no de carga completa del celular.
SHA256 de la copia conservado:
001e62eb8b7924e3ec09a360d3bafcbd1fd0ea2cf3ef24d393573f8935923d64.

Ejecutar: node scripts/smoke-preventa-trace-performance.js [copia-local.json]

Despliegue: solo app.js, token de recurso en index.html, esta documentacion y
la prueba. Excluir cambios pendientes de reparto y backend. Respaldar datos y
archivos previos, regenerar integridad, verificar salud, hash publico y mismo
PID. No reiniciar ni cerrar sesiones. Las paginas abiertas incorporan el cambio
al volver a cargar, despues de guardar sus pedidos pendientes.

Pendiente independiente: eliminar bloqueos de persistencia del estado completo
de 58 MB. Este hotfix no resuelve ese cuello de botella del servidor.
