# P7 - Edicion de clientes

Estado: implementado localmente, pendiente de validacion visual y despliegue.
No se modificaron datos ni servicios de produccion.

## Causas y cambios

- La ficha buscaba solo en state.clients, aunque el listado paginado tenia otros registros. Ahora consulta tambien la pagina visible y el diagnostico de cartera.
- Codigo e ID exactos tienen prioridad sobre nombres. Los nombres ambiguos no seleccionan arbitrariamente un cliente. El servidor usa la misma prioridad.
- Los errores al construir los horarios se muestran sin perder el formulario.
- Un guardado en curso bloquea el doble envio. El boton vuelve a habilitarse al terminar.
- El exito invalida cache, consulta nuevamente la pagina, cierra la ficha, restaura scroll y muestra confirmacion.
- Respuestas de consultas anteriores ya superadas no repueblan la cache con datos viejos.
- Se mantienen clave administrativa, motivo e historial. No se eliminan validaciones de seguridad.

## Pruebas locales aprobadas

- smoke-p7-client-edit.js: pagina fuera de state, codigo frente a nombre, ID interno, nombres ambiguos, doble envio, errores conservan formulario, cierre/confirmacion/scroll y refresco (DOM simulado).
- smoke-client-edit-validation.js: saldos con centavos, saldo a favor, coordenadas y permisos de limite conservados.
- smoke-client-hours-v123.js: franjas validas, incompletas, invertidas y compatibilidad con horarios historicos.
- smoke-order-workflow-v114.js: servidor temporal con datos ficticios; edicion por ID, persistencia de dias/horarios e historial; clave incorrecta y horario invalido sin modificar cliente. Regresion de pedidos y stock aprobada.
- La primera ejecucion HTTP no accedio al servidor por aislamiento de red; repeticion autorizada fuera del aislamiento aprobada. El servidor temporal termino.

## Antes de produccion

1. En demo, abrir cliente de una pagina posterior del listado, cambiar dia y horario con motivo y clave.
2. Confirmar mensaje, cierre y posicion del listado; reabrir y comprobar valores.
3. Probar horario incompleto y clave incorrecta: mantener ficha y datos ingresados.
4. Verificar filtros activos y listado actualizado, incluyendo cambio que saque al cliente del filtro.
5. Respaldo y despliegue controlado con verificacion posterior. No se incremento version ni se publico este paquete.
