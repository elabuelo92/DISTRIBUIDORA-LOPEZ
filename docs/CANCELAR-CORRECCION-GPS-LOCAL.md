# Cancelar correccion GPS

Estado: implementado localmente, pendiente de despliegue. No se modificaron
clientes productivos ni se reinicio el ERP para esta solicitud.

En Clientes aparece Cancelar correccion cuando existe una revision needs_correction,
pending_validation o rejected. Solicita motivo (1-500 caracteres) y confirmacion.
Solo Administracion puede ejecutar action=cancel en el endpoint gps-review existente.
expectedUpdatedAt evita cancelar una revision modificada desde la ultima consulta.

La accion conserva coordenadas actuales y todos los demas campos del cliente;
no activa clientes dados de baja ni altera restricciones comerciales. Cambia
gpsReview.status a cancelled y elimina la propuesta pendiente del estado actual,
conservandola en el antes de la auditoria. Registra motivo, fecha y administrador.
El listado distingue Correccion GPS cancelada de GPS aprobado. No se aprueba
implicitamente ninguna coordenada propuesta. El vendedor recibe el nuevo estado
por la sincronizacion existente; no se agregan consultas periodicas ni endpoints.

Validacion aislada:
- HTTP: los tres estados bloqueantes; seller sin permiso; motivo obligatorio;
  rechazo de version obsoleta y doble cancelacion; datos intactos ante errores.
- Coordenadas, otros campos, productos y pedidos existentes sin cambios.
- Auditoria conserva propuesta anterior, usuario y motivo.
- Sincronizacion del vendedor y creacion de nuevo pedido tras cancelar: OK.
- Frontend: boton, confirmacion, motivo, version y mensaje: OK.
- Regresiones seller-catalog-sync y state-sections: OK. Sintaxis: OK.

La verificacion de frontend es automatizada sobre la funcion y el marcado; no
se realizo una comprobacion visual con el backend nuevo en la demo compartida.
El proceso Node productivo debe reiniciarse para cargar la nueva accion; publicar
solo el boton dejaria una accion inexistente en el servidor. La instalacion actual
no permite garantizar cero interrupcion. Requiere ventana de despliegue con backup,
versionado de assets, integridad y reinicio, o excepcion expresa del usuario.
