# P5 - Cuenta corriente y diferencias de caja

Estado: paquete 8790-174 preparado para el despliegue y reinicio autorizado el 19/10/2026.
Pruebas finales repetidas: cache/version, flujo P5, HTTP concurrente, manifiesto por
ruta y cobranzas mixtas. El resultado productivo se registra por separado tras publicar.
Base aislada: e632cfa (P4 publicado). No incluye P6-P11 en desarrollo.

## Diagnostico de solo lectura

PED-3785, Fernanda Maldonado (9 a 22), importe 107443.72.
Cobro registrado el 15/10/2026 como Transferencia Pendiente: efectivo 0,
transferencia registrada 0, promesa 107443.72, cuenta corriente explicita 0.
La deuda del cliente ya contiene 107443.72. No corresponde cargarla nuevamente.
Ruta RUTA-20261014-JUEVES-R1-CHINO-Y-NICO, con cierre ya guardado.
El manifiesto omitio la promesa y mostraba diferencia -107443.72.
El acumulador de transferencias de ruta incluye promesas; cierre y precarga las
trataban como transferencias rendidas. No se reescribe ese cierre historico.

## Correccion

- Manifiesto: deuda de visita = cuenta corriente explicita + promesa sin comprobante.
- Nuevos cierres: separar promesas del acumulador de transferencias esperadas.
- Pantallas de ruta y precarga de rendicion usan el mismo helper de transferencias.
- Etiquetas distinguen transferencia registrada de validacion bancaria y pendiente
  de visita de saldo actual. Exportaciones explican el alcance de los importes.
- Cierres ya guardados se muestran como historicos, conservando valores originales.
- Registros antiguos sin desglose no se reconstruyen por inferencia.
- Sin migracion, ajuste de saldo, validacion bancaria automatica ni movimiento de stock.

## Pruebas aprobadas

1. smoke-p5-pending-transfer: deuda prometida, pago parcial/mixto, diferencia real.
2. smoke-p5-workflow: recorrido motor, reintentos, validacion bancaria una sola vez,
   cierre inmutable, stock intacto, caso PED-3785 anonimizado y compatibilidad anterior.
3. smoke-p5-http: servidor temporal y datos ficticios; dos cierres concurrentes
   producen un unico cierre; cuentas, clientes, pedidos y stock identicos.
4. smoke-route-collection-scope: aislamiento por ruta, PDF/Excel y totales historicos.
5. smoke-collections-v136: cobranzas mixtas, tolerancias, saldo a favor y autorizacion.
6. smoke-delivery-financial-visibility: entrega independiente del estado de cobro.
7. smoke-collection-workbook-layout: XLSX numerico, ajuste de texto e impresion.

Revision visual en componente aislado: caso de 107443.72 como cuenta corriente,
diferencia cero, separacion entre nuevo cierre y cierre historico.
No se realizo cobro o cierre de prueba en produccion.

## Publicacion pendiente

Version/cache 8790-174 comprobada. Pendiente respaldo, reinicio autorizado y
comparacion completa de datos. Revisar con Administracion la pantalla real tras
publicacion, sin modificar el cierre historico ni registrar movimientos ficticios.
