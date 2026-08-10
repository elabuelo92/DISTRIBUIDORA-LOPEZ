# Prompt 2 - Pagos parciales - v27

Fecha: 2026-06-29

## Objetivo

Permitir que reparto registre entregas y cobranzas parciales sin perder trazabilidad.

## Implementado

- Cobro parcial del pedido.
- Calculo automatico de saldo pendiente.
- Registro de productos entregados por cantidad.
- Registro acumulado por item:
  - cantidad pedida;
  - cantidad ya entregada;
  - cantidad pendiente.
- El saldo no cobrado se envia automaticamente a Cuenta Corriente.
- Historial de cobranzas/entregas dentro del pedido.
- La parada de ruta puede cerrarse como parcial y habilitar el siguiente cliente.

## Estados de entrega

El flujo de entrega queda expresado como:

```text
Pendiente -> Parcialmente Entregado -> Entregado
```

Dentro del sistema operativo completo convive con el flujo anterior:

```text
Despachado -> Bajar -> Controlado -> Parcialmente Entregado / Entregado
```

## Regla de cobranza parcial

```text
Saldo pendiente = Total del pedido - Importe recibido
```

Ese saldo se registra como movimiento de Cuenta Corriente del cliente.

## Regla de productos

El repartidor debe informar al menos un producto entregado.

Si todas las cantidades pendientes se entregan:

- estado: Entregado.

Si queda alguna cantidad sin entregar:

- estado: Parcialmente Entregado.

## Pendiente para siguiente fase

Esta version registra la entrega parcial y el saldo pendiente. No reingresa automaticamente al stock la mercaderia no entregada. Ese punto debe resolverse en el futuro modulo de devoluciones/rearmado de pedidos para evitar diferencias fisicas.

## Prueba

Ejecutar:

```powershell
cd C:\DistribuidoraLopez\SERVIDOR_UNICO_8790
powershell.exe -ExecutionPolicy Bypass -File .\scripts\smoke-v27.ps1
```

Debe validar:

- servidor activo en v27;
- archivos JavaScript sin errores;
- entrega parcial deja pedido en "Parcialmente Entregado";
- saldo pendiente impacta en cuenta corriente;
- productos registran entregado y pendiente.
