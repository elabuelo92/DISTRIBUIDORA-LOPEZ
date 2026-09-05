# Prompt 134 - Comisiones y cuenta del vendedor

## Diagnostico

- El informe tomaba `item.qty`, pero los pedidos normalizados guardan `requestedQty`; la cantidad podia mostrarse en cero.
- El pago de comisiones marcaba todos los pedidos del periodo como liquidados, incluso frente a un pago parcial.
- El backend aceptaba el total informado por el navegador sin compararlo contra el saldo pendiente.
- La seleccion de vendedor para una regla era texto libre y podia perder la asociacion con el `username` real.

## Correccion

- Cada linea de comision conserva cantidad y precio historicos.
- PDF y Excel muestran cantidades reales, porcentaje, comision y total alineado.
- La cuenta del vendedor separa devengado, pagado y saldo por periodo.
- Los pagos parciales se aplican FIFO contra pedidos concretos y registran medio, referencia, usuario y asignaciones.
- El backend impide pagos mayores al saldo.
- La creacion de reglas utiliza vendedor/repartidor seleccionado y guarda nombre mas `username`.
- El control de reglas distingue vendedores con regla especifica de quienes utilizan la regla general.

## Pruebas

```powershell
npm.cmd run test:commission-account
npm.cmd run test:commission-governance
npm.cmd run test:preventa-commissions
```

No se recalculan ni eliminan comisiones historicas durante el despliegue.
