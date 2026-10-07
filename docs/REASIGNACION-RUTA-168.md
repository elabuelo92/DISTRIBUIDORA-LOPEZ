# Reasignacion administrativa de ruta publicada

2026-10-07. Alcance: corregir el repartidor de una ruta publicada sin iniciar.

Se reutiliza POST /api/delivery/routes/:id/driver. Para rutas publicadas se exige administracion, asignacion y updatedAt esperados, ausencia de dispositivo/inicio/cierre/cobros y todos los pedidos despachados. No se vuelve a publicar ni se modifica stock. Se registra auditoria con asignacion anterior y nueva.

Pruebas aisladas sobre el paquete de despliegue: 35 pedidos de Eduardo y 41 de Chino; invariantes de pedidos, productos, cuentas y otras rutas; rechazos sin mutacion ante concurrencia, roles incorrectos, cobros, dispositivo o inicio. HTTP con 100 pedidos publicados y reasignados sin diferencias en pedidos/stock/cuentas. Version/cache 168 verificados.

Solicitud operativa: RUTA-20261007-MIERCOLES-R1-EDUARDO de reparto2 a reparto1. No modificar RUTA-20261007-MIERCOLES-R2-CHINO. El usuario autorizo expresamente reinicio controlado del ERP durante la jornada. Despliegue con backup y comparacion exacta de estado y usuarios antes de abrir mantenimiento. La reasignacion se realiza luego mediante el flujo administrativo y requiere validacion posterior.

No incluye los cambios pendientes de recuperacion de dispositivos de otro trabajo.
