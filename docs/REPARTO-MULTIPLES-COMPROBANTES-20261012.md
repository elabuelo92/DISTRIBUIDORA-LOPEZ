# Comprobantes multiples desde Reparto

Estado: local, pendiente de pruebas finales y despliegue con respaldo.

En Confirmar entrega: indicar total de transferencia, seleccionar archivo,
importe y banco; Agregar comprobante. Repetir hasta 10 archivos. Se puede quitar
un archivo antes de confirmar. La suma debe coincidir exactamente con el total
transferido. Para un solo archivo sigue disponible el flujo anterior.

Una entrega produce una sola cobranza, con varios registros de conciliacion.
La deuda por transferencias sigue pendiente hasta validacion bancaria individual.
No cambia el total original del pedido ni duplica stock, efectivo o cuenta corriente.
El manifiesto conserva una fila por pedido y muestra todos los bancos usados.

Protecciones: ID persistido de cobro, rechazo de reintento con contenido cambiado,
doble envio simultaneo idempotente, permisos/dispositivo existentes, importes
positivos de dos decimales, suma exacta y archivos repetidos rechazados.
El navegador reutiliza archivos ya subidos durante un reintento en el mismo dialogo.
Un fallo de red durante la subida de un archivo puede dejar un archivo sin asociar,
pero no registra ningun pago. No existe reenvio automatico de cobranzas.

Pruebas:
- smoke-driver-multiple-proofs.js: efectivo 400, transferencias 200+300 y deuda 100;
  saldo 600 antes de validar y 100 despues; revalidacion sin duplicar credito;
  persistencia JSON, dispositivo incorrecto, sumas invalidas y reintentos.
- smoke-driver-multiple-proofs-ui.js: lista, suma, archivos repetidos y cache de subida.
- smoke-multiple-transfer-proofs-http.js: dos POST simultaneos, un cobro y dos
  comprobantes; permisos y cambios de contenido rechazados; datos ficticios.
- Regresiones: cobranza v136, manifiestos por ruta y comprobantes administrativos.

Checklist operativo posterior:
- [ ] Repartidor: agregar dos comprobantes con bancos distintos.
- [ ] Quitar uno y volver a agregarlo antes de confirmar.
- [ ] Revisar ambos en conciliacion y el total del manifiesto de esa ruta.
- [ ] Validar uno y comprobar que el otro continua pendiente.
- [ ] Confirmar experiencia con camara/galeria en un celular real.

No realizar cobros ficticios sobre pedidos de produccion.
