# Modulo Cuentas - Conciliacion bancaria

Fecha: 2026-07-05  
Version: v34 - PREPARACION CONCILIACION BANCARIA  
Servidor objetivo: `http://127.0.0.1:8790`

## Objetivo

Preparar el sistema para registrar transferencias de manera conciliable y dejar la base lista para una futura importacion automatica de movimientos bancarios.

## Datos obligatorios por transferencia

Cada transferencia registrada desde reparto guarda:

- Banco.
- Alias.
- CBU/CVU.
- Fecha.
- Hora.
- Importe.
- Estado.
- Pedido asociado.
- Cliente.
- Comprobante adjunto.
- Observaciones.

## Estados

Estados disponibles:

- `Pendiente`: transferencia recibida, aun sin validar contra banco.
- `Validada`: Administracion confirmo que impacto correctamente.
- `Rechazada`: Administracion detecto comprobante falso, rechazado o no impactado.

## Panel administrativo

Ubicacion:

`Cuentas corrientes > Conciliacion`

Desde ese panel Administracion puede:

- Ver banco, alias, CBU, fecha, hora e importe.
- Abrir el comprobante adjunto.
- Marcar como `Validada`.
- Marcar como `Rechazada`.
- Volver a `Pendiente`.

## Preparacion para conciliacion automatica

Cada registro genera una clave tecnica de conciliacion (`matchKey`) compuesta por:

- Fecha normalizada.
- Importe.
- Banco normalizado.
- Alias normalizado.
- CBU solo numerico.

En la siguiente fase se podra importar extractos bancarios y cruzar automaticamente por esa clave o por coincidencia de importe/fecha/alias.

## API agregada

`POST /api/bank-reconciliation/transfers/:id/status`

Payload:

```json
{
  "status": "Validada",
  "reason": "Impacto confirmado en banco"
}
```

Estados validos:

```json
["Pendiente", "Validada", "Rechazada"]
```

## Verificacion

Ejecutar:

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\scripts\smoke-v34.ps1
```

La prueba valida:

- Index publicado con marca `8790-34`.
- Sintaxis de motores y servidor.
- Registro de transferencia conciliable con banco, alias, CBU, fecha, hora e importe.
- Estado inicial `Pendiente`.
- Cambio a `Validada`.
- Cambio a `Rechazada`.
- Rechazo de estados invalidos.
