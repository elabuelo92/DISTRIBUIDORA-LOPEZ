# Correccion GPS desde Reparto

Estado de preparacion: pruebas locales repetidas y aprobadas; despliegue solicitado por el usuario el 12/10/2026. Captura en celular real pendiente. La publicacion se confirma por separado tras el respaldo y la validacion de produccion.

## Flujo
1. Administracion marca GPS a corregir desde Clientes. Conserva el circuito existente, incluido el bloqueo temporal de nuevas ventas.
2. Reparto presenta la herramienta Corregir ubicaciones con solicitudes abiertas de clientes visibles para ese usuario segun sus rutas. Se conserva el alcance especial existente del planificador Dario.
3. El repartidor confirma que esta frente al comercio y captura GPS nuevo, sin editar coordenadas manualmente.
4. La propuesta queda pendiente de validacion. Administracion aprueba, rechaza o cancela desde Clientes.
5. La coordenada operativa anterior no cambia hasta la aprobacion. Se reutiliza la actualizacion de mapas y rutas existente.

## Controles
- Endpoint GPS existente, sin nuevas tablas ni circuitos de aprobacion.
- Repartidor solo puede enviar: no puede marcar, cancelar, aprobar ni rechazar.
- Alcance de clientes comprobado en servidor mediante la proyeccion de usuario existente.
- Version del cliente evita enviar contra una solicitud cancelada o modificada.
- Captura de hasta 60 segundos; sin fallback a coordenada anterior.
- Doble toque bloqueado en UI; una propuesta pendiente no puede reemplazarse con otra captura.
- Auditoria conserva usuario, rol, equipo, precision, fecha y coordenadas anterior/propuesta.
- Captura nativa con espera acotada a 20 segundos y liberacion del temporizador; navegador con maximumAge=0.
- No agrega polling permanente ni peticiones por cliente.

## Verificado
- smoke-client-gps-review-v135: HTTP real contra servidor temporal, dos repartidores, permisos, datos sin cambios, captura duplicada/desactualizada, revision administrativa y sincronizacion con preventa.
- smoke-delivery-gps-correction-ui: captura precisa, payload versionado, doble toque, pendiente sin boton, filtro de estados y rol.
- smoke-gps-refresh: coordenadas aprobadas prevalecen, visitas historicas conservadas, mapa actualizado.
- smoke-gps-cancel-ui: cancelacion existente preservada.
- Sintaxis app.js y server.js OK.

## Pendiente antes de produccion
- Probar GPS y permiso de ubicacion en navegador movil/APK con un cliente de prueba.
- Identificador de cache actualizado a 8790-169-r20261012c; realizar respaldo y despliegue controlado autorizado.
- Verificar captura y aprobacion con sesiones reales sin modificar pedidos ni cobros.

La solicitud de descuento por producto ya fue comprobada en produccion, commit 92c54dd, con pruebas de interfaz y aprobacion por ID de linea. Este nuevo cambio GPS no forma parte de ese commit.
