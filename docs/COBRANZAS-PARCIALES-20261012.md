# Cobranzas parciales: primera correccion local

Estado: implementado localmente, pendiente de despliegue y validacion visual.

## Hallazgo reproducido

Al ingresar efectivo parcial y luego seleccionar Pago mixto manual,
applyDeliveryPaymentPreset borraba efectivo y transferencia. La deuda calculada
pasaba a ser el total. Esto es un defecto confirmado del formulario, pero no
prueba por si solo la causa de los dos incidentes reales informados.

## Cambio acotado

El modo mixto conserva los importes ingresados. Los comandos Todo efectivo,
Todo transferencia y Todo cuenta corriente siguen reemplazando la distribucion
de forma explicita. No cambia el motor contable ni datos guardados.

## Pruebas ejecutadas

- smoke-payment-preset-preservation.js: fallo antes del cambio y paso despues.
  Total 250000, efectivo 100000, deuda 150000; agregar transferencia 50000
  deja deuda 100000. Pulsar Mixto repetidamente conserva ambos importes.
- smoke-route-collection-scope.js: paso; aislamiento por ruta, cobros entre
  dias, totales de exportacion y pago parcial 92993 - 87230 = 5763.
- smoke-collections-v136.js: paso; cobranza mixta, saldo a favor, tolerancia
  de caja y autorizacion administrativa. Datos ficticios, sin escrituras remotas.

Las pruebas se ejecutaron en el checkout local con otros cambios preexistentes.
Antes de desplegar, aislar el cambio y repetir las pruebas sobre el artefacto
exacto de lanzamiento, ademas de verificar el formulario en navegador.

## Pendiente

- Obtener IDs o Excel original de los dos cobros reportados.
- Contrastar collection del pedido/parada, cuenta corriente, transferencia y
  manifiesto. Distinguir error de exportacion de error contable persistido.
- No corregir historicos ni inferir importes faltantes automaticamente.
- Aumento de letra del Excel y restantes incidencias siguen pendientes.
- No se desplego ni reinicio ningun servicio en este bloque.
