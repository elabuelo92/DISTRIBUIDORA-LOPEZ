# Prompt 1 - Cuentas Corrientes - v26

Fecha: 2026-06-29

## Objetivo

Implementar un modulo completo de Cuentas Corrientes para que Preventa y Administracion vean el riesgo crediticio antes de confirmar un pedido.

## Implementado

- Motor compartido `account-engine.js`.
- Resumen por cliente:
  - saldo actual;
  - limite de credito;
  - deuda vencida;
  - deuda total;
  - ultimo pago;
  - estado de la cuenta.
- Vista nueva en el modulo Cuentas Corrientes con KPIs y tabla por cliente.
- Filtro por estado de cuenta.
- La ficha de Clientes ahora muestra estado de cuenta y deuda total.
- Preventa movil muestra informacion de cuenta antes de enviar pedido.
- Nuevo pedido desde Administracion muestra preview de cuenta antes de confirmar.
- Validacion de credito en servidor:
  - saldo actual + pedidos pendientes + pedido nuevo contra limite de credito;
  - cliente bloqueado requiere autorizacion;
  - cuenta sin limite configurado y con exposicion crediticia requiere autorizacion;
  - vendedores no pueden saltear la regla;
  - administradores pueden continuar solo con confirmacion/autorizacion.

## Regla aplicada

```text
Deuda total proyectada = saldo actual + pedidos pendientes no cerrados + pedido nuevo

Si deuda total proyectada > limite de credito:
  requiere autorizacion administrativa
```

## Usuarios autorizados

Por defecto, los usuarios con rol `admin` pueden autorizar exceso de limite:

- admin1
- admin2
- admin3

El motor tambien soporta el permiso `creditAuthorization` para futuros usuarios especiales.

## Importante

El saldo actual no se aumenta al cargar preventa para evitar doble contabilizacion. El pedido queda como exposicion pendiente hasta que se entrega y cobra. Cuando reparto registra cobranza como saldo pendiente / cuenta corriente, el saldo del cliente se actualiza automaticamente.

## Pruebas

Ejecutar:

```powershell
cd C:\DistribuidoraLopez\SERVIDOR_UNICO_8790
powershell.exe -ExecutionPolicy Bypass -File .\scripts\smoke-v26.ps1
```

Debe validar:

- servidor activo;
- frontend v26 servido;
- archivos JS sin errores;
- motor de credito bloquea pedidos sobre limite;
- usuario admin puede autorizar;
- vendedor no puede autorizar.

## Pendientes relacionados

- Crear pantalla especifica de autorizaciones pendientes para administracion.
- Registrar motivo manual de autorizacion.
- Separar "Cuenta corriente" de "Fiado / saldo pendiente" en lenguaje final de reparto.
- Incorporar aging de deuda por factura cuando exista facturacion formal.
