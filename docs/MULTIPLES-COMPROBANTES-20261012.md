# Multiples comprobantes parciales por pedido

Estado: implementado localmente; pendiente de despliegue controlado.

## Alcance

Administracion, conciliacion bancaria: al adjuntar un comprobante a una
transferencia pendiente sin adjunto, indicar el importe de ese comprobante.
El remanente aparece como otra transferencia pendiente del mismo pedido,
cliente y ruta. Repetir sobre el remanente para cargar los siguientes.
Cada comprobante se valida o rechaza por separado.

No modifica el total del pedido, productos, stock ni el saldo del cliente al
adjuntar. La deuda se cancela solamente al validar cada transferencia.
No convierte automaticamente deuda en efectivo ni crea pedidos duplicados.
Transferencias ya adjuntadas conservan su importe; no se fraccionan pagos
ya validados. La captura multiple durante el cobro en la app de reparto
no forma parte de este cambio.

## Protecciones

- Identificador de solicitud y hash del archivo para reintentos seguros.
- Doble envio concurrente: un archivo, una auditoria, una division.
- Importe positivo, hasta dos decimales y no mayor al pendiente.
- Control de importe esperado contra formularios desactualizados.
- Solo administracion; permisos existentes conservados.
- Historial del importe original, remanente, usuario y fecha.
- Sin migracion de datos historicos ni correcciones masivas.

## Pruebas

- smoke-multiple-transfer-proofs.js: tres comprobantes 100000/50000/100000,
  total 250000, validacion repetida sin doble credito, rechazo independiente,
  persistencia JSON, compatibilidad con clientes anteriores.
- smoke-multiple-transfer-proofs-http.js: servidor aislado y datos ficticios;
  permisos, sobreimporte sin escritura, reintentos simultaneos sin archivos ni
  auditorias duplicadas, saldo intacto hasta validar.
- smoke-multiple-transfer-proofs-ui.js: importe del formulario, bloqueo del
  importe con adjunto existente, identificador de solicitud y version esperada.
- Dialogo aislado renderizado en Chrome a 1280x900 y 390x844; campo editable,
  controles visibles y captura movil revisada. No sustituye aceptacion bancaria.
- Regresiones de cuentas consolidadas, cobranza y aislamiento de manifiestos:
  aprobadas sobre el paquete aislado. Tres comprobantes triangulados generan
  tres movimientos pendientes de proveedor sin duplicarse al revalidar.

## Aceptacion operativa pendiente

- [ ] Administrador: cargar varios comprobantes de un pedido y revisar remanente.
- [ ] Validar uno y rechazar otro; comparar cuenta corriente con el banco.
- [ ] Comprobar manifiesto de la ruta: total transferido sin duplicarse.
- [ ] Verificar cuentas trianguladas con proveedor en un entorno de prueba.

No se modifican cobros reales para realizar pruebas.
