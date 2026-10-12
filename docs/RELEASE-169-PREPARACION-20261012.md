# Preparacion 169 - no desplegada

Excepcion antes de las 18 autorizada por el usuario el 12/10/2026.

Paquete aislado desde HEAD de produccion 2af3c19. No se modifico el checkout
original para recuperar las exportaciones: se excluyeron sus regresiones del
artefacto. Permanecen en origen las modificaciones y eliminaciones ajenas.

Incluye descuentos por linea pendientes de autorizacion, claridad entrega/cobro
en reparto y manifiestos, ficha de clientes con centavos/GPS y preservacion de
saldo a favor, y recuperacion administrativa de dispositivo de ruta.

14 suites locales aprobadas sobre este artefacto:
smoke-client-edit-validation, smoke-preventa-line-discounts,
smoke-preventa-line-discounts-ui, smoke-multi-discount-v138,
smoke-discount-product-binding-v135, smoke-authorized-offers-v138,
smoke-delivery-financial-visibility, smoke-route-collection-scope,
smoke-manifest-pdf-layout, smoke-delivery-driver-ux, smoke-collections-v136,
smoke-route-device-recovery, smoke-readable-exports, smoke-tabular-exports.

Validacion automatica aprobada; revision operativa de formularios y manifiestos
se completa con checklist posterior, sin operaciones ficticias en produccion.
Demo sintetica http://127.0.0.1:21913 responde health OK version 8790-169-preview,
pero navegador integrado devuelve ERR_CONNECTION_REFUSED. Se solicito al
usuario comprobar apertura local. No se aceptaron terminos de esta demo nueva.

Produccion inspeccionada solo lectura: PID 2927174, commit 2af3c19,
health/licencia/integridad OK, mantenimiento desactivado, 9 sesiones activas,
sin cola ni rechazos de sincronizacion al momento de la consulta.

Usuario confirmo que la demo abre y ordeno desplegar el paquete y luego probar
las modificaciones con checklist. La confirmacion de apertura no equivale a
validacion visual completa de todos los formularios.

Al preparar este documento aun no hubo push, backup, mantenimiento ni reinicio. Antes de publicar:
validacion visual, commit/push solo artefacto revisado, respaldo verificado,
despliegue con rollback, comparacion integral de datos y validacion autenticada.
