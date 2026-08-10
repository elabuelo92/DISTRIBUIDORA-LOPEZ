# Modulo Repartidor - Entrega, cobranza y devolucion

Fecha: 2026-07-04  
Version: v32 - REPARTIDOR ENTREGA COMPLETA  
Modulo: Reparto

## Objetivo

Modificar la app del repartidor para que el cierre de una parada permita registrar todo lo ocurrido en la entrega y sincronizarlo automaticamente con el servidor.

## Funciones implementadas

Al cerrar un pedido en reparto, el repartidor puede:

- Confirmar entrega.
- Sacar y adjuntar foto de entrega.
- Adjuntar comprobante de transferencia.
- Registrar cobro en efectivo.
- Registrar mercaderia devuelta.
- Registrar observaciones generales.
- Guardar GPS de cierre.

## Regla de devolucion

La mercaderia devuelta no se cobra y no queda como saldo pendiente.

Formula:

`Total cobrable = Total del pedido - Importe devuelto`

Ejemplo:

- Pedido original: 5 unidades x $100 = $500.
- Entregado: 3 unidades.
- Devuelto: 2 unidades.
- Total devuelto: $200.
- Total cobrable: $300.

## Sincronizacion

Al confirmar entrega, el sistema envia al servidor:

- Productos entregados.
- Productos devueltos.
- Motivo de devolucion.
- Forma de cobro.
- Importe cobrado.
- Saldo pendiente.
- Foto de entrega.
- Comprobante de transferencia si corresponde.
- Observaciones.
- GPS.

El servidor guarda esta informacion en:

- Pedido.
- Parada de ruta.
- Auditoria de reparto.
- Actividad operativa.
- Totales de la ruta.

## Totales de ruta

La ruta acumula:

- Efectivo.
- Transferencias.
- Saldo pendiente.
- Devoluciones.

## Prueba tecnica

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\scripts\smoke-v32.ps1
```

La prueba valida:

- Sintaxis de archivos principales.
- Version `8790-32`.
- Cierre de entrega con efectivo.
- Registro de devolucion.
- Observaciones.
- Acumulado de devolucion en ruta.
- Auditoria de reparto.
