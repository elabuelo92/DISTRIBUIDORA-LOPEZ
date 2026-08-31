# Pedido por WhatsApp desde Preventa v121

## Flujo

1. Preventa envia el pedido al servidor.
2. El servidor confirma el guardado o la reconciliacion idempotente.
3. La aplicacion conserva el pedido confirmado y el telefono de la ficha del cliente.
4. Aparece la tarjeta `Pedido guardado correctamente`.
5. `Compartir por WhatsApp` abre el numero del cliente con el resumen completo.
6. `Compartir` utiliza el menu estandar del dispositivo o copia el texto como ultimo recurso.

La aplicacion no comparte un carrito sin guardar ni un intento cuya confirmacion no pudo reconciliarse.

## Datos permitidos

- numero y fecha del pedido;
- cliente;
- productos, cantidades, precios unitarios y subtotales;
- descuento efectivamente aplicado;
- total;
- forma de pago;
- observacion comercial marcada expresamente como publica y aprobada.

No se leen costos, margenes, comisiones, stock, notas administrativas ni observaciones operativas.

## Validacion

```powershell
npm.cmd run test:order-share
```

La prueba incluye intencionalmente datos internos y verifica que no aparezcan en el mensaje.
