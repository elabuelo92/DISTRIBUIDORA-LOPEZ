# Prompts 133 y 137 - Cuentas consolidadas y carteras PDF

Version: 8790-135
Fecha: 06/09/2026 ART

## Prompt 133 - Estado de cuenta consolidado

Administracion puede abrir la ficha de cuenta mediante doble clic o con el boton `Cuenta` desde Clientes, Cuentas y Proveedores.

La ficha muestra:

- identificacion y estado de la entidad;
- saldo, deuda, limite y totales consolidados;
- movimientos con fecha, medio, referencia, debe, haber, saldo, estado y usuario;
- historial de pedidos del cliente u operaciones del proveedor;
- acciones para editar, imprimir y registrar pagos.

### Pago parcial de clientes

1. Abrir la cuenta del cliente.
2. Seleccionar `Registrar pago parcial`.
3. Indicar importe y medio real.
4. Para transferencia, Mercado Pago o cheque, informar referencia.
5. Confirmar `Aplicar pago`.

El sistema impide importes mayores al saldo. El movimiento conserva saldo anterior, saldo nuevo, medio, referencia, observacion, fecha y usuario. La respuesta actualiza la ficha sin recargar toda la aplicacion.

### Pago de proveedores

Desde la cuenta del proveedor, `Registrar pago proveedor` abre el circuito existente. El respaldo documental sigue siendo obligatorio y el pago queda pendiente de conciliacion. El saldo no se considera cancelado hasta completar esa conciliacion.

### Medio de pago

La opcion elegida se envia y se muestra sin sustituciones silenciosas. En Reparto, `Transferencia Pendiente` se conserva cuando existe saldo pendiente; una combinacion real de efectivo y transferencia se registra como `Mixto`.

## Prompt 137 - Carteras completas en PDF

Administracion dispone de:

- `Clientes` -> `PDF cartera completa`;
- `Precios` -> `PDF productos y precios`.

El PDF de clientes incluye identificacion, CUIT, telefono, domicilio, localidad, zona, ruta, vendedor, dias y horario de visita, estado, forma de pago, saldo y GPS.

El PDF de productos incluye codigo, EAN, descripcion, rubro, marca, proveedor, estado, costo, stock, unidad y precios vigentes de Lista 1 a Lista 5.

Las exportaciones toman la cartera completa del estado administrativo, no solamente la pagina visible ni el bloque desplegado. Cada archivo incluye fecha, hora y version de emision.

## Validacion automatizada

```powershell
npm.cmd run test:consolidated-accounts
npm.cmd run test:portfolio-pdf
npm.cmd run test:cache-update
```

Las pruebas cubren consulta HTTP, pago parcial, proteccion contra sobrepago, trazabilidad de proveedor, doble clic, listas 1 a 5, productos activos/inactivos y cache de la version.
