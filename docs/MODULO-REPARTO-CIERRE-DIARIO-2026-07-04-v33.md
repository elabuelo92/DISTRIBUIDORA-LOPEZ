# Modulo Reparto - Cierre diario

Fecha: 2026-07-04  
Version: v33 - CIERRE DIARIO DE REPARTO  
Servidor objetivo: `http://127.0.0.1:8790`

## Objetivo

Agregar una rendicion diaria de ruta para que el repartidor informe el cierre operativo y Administracion tenga un resumen automatico.

## Flujo implementado

1. Administracion planifica y publica la hoja de ruta.
2. El repartidor toma la ruta desde el telefono.
3. En cada parada registra entrega, foto, firma, transferencia, efectivo, saldo pendiente, devolucion y observaciones.
4. Al finalizar la ruta toca `Cerrar ruta diaria`.
5. El sistema calcula lo esperado y lo compara contra lo informado.
6. Administracion ve el cierre en el panel `Reparto y cobranza > Cierres diarios`.

## Datos del cierre

El cierre guarda:

- Ruta.
- Fecha y hora.
- Usuario.
- Dispositivo.
- GPS del cierre.
- Total efectivo esperado.
- Total efectivo informado.
- Total transferencias esperado.
- Total transferencias informado.
- Pedidos entregados.
- Pedidos pendientes.
- Pedidos devueltos.
- Importe devuelto.
- Saldo pendiente generado.
- Diferencia de efectivo.
- Diferencia de transferencias.
- Diferencia total.
- Observaciones.

## Reglas

- No se puede cerrar una ruta que sigue en estado `Planificada`.
- Una ruta solo puede tener un cierre diario.
- El cierre exige GPS valido.
- Si quedan pedidos pendientes, el cierre se permite pero queda marcado en el resumen.
- Si hay diferencia de efectivo o transferencia, el valor queda registrado como diferencia positiva o negativa.

## API agregada

`POST /api/delivery/routes/:id/close`

Payload:

```json
{
  "deviceId": "DEV1",
  "deviceLabel": "Reparto 1",
  "gps": { "lat": -31.42, "lng": -64.18, "accuracy": 8, "source": "gps" },
  "reportedCash": 280,
  "reportedTransfer": 0,
  "observations": "Faltan 20 pesos en rendicion."
}
```

Respuesta:

```json
{
  "ok": true,
  "route": {},
  "closure": {},
  "summary": {}
}
```

## Verificacion

Ejecutar:

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\scripts\smoke-v33.ps1
```

La prueba valida:

- Sintaxis de motores y servidor.
- Index publicado con marca `8790-33`.
- Cierre con una entrega, un pendiente, una devolucion y diferencia negativa.
- Resumen administrativo en `deliveryClosures`.
- Auditoria `CIERRE_DIARIO_REPARTO`.

