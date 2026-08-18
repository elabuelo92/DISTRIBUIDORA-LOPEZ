# Version 8790-99 - Importador y cobranza mixta

Fecha: 18/08/2026

## Alcance

- El importador valida que el archivo sea un XLSX real antes de enviarlo a ExcelJS.
- Los fallos internos de lectura se convierten en mensajes operativos claros.
- La aplicacion rechaza extensiones distintas de `.xlsx` antes de subir el archivo.
- En Reparto, al ingresar una transferencia sobre el total precargado en efectivo, el sistema redistribuye automaticamente el efectivo restante y cambia el modo a `Mixto`.
- El mismo comportamiento se aplica en sentido inverso cuando el total estaba precargado como transferencia.

## Prueba de cartera

Archivo validado:

`C:\Users\Distribuidora Lopez\Desktop\Cartera de producto actualizado al 17 de ago.xlsx`

Resultado conocido de produccion:

- 310 productos en el archivo.
- 278 coincidencias seguras.
- 32 productos pendientes de homologacion.
- 377 productos actuales ausentes de la cartera nueva.

La correccion no aplica datos automaticamente. Antes de aplicar se debe definir expresamente:

1. Si los 32 productos pendientes se crean como altas nuevas o se omiten individualmente.
2. Si los 377 productos actuales ausentes se inactivan o permanecen activos.

## Uso de la cobranza mixta

1. Abrir `Cobrar y entregar`.
2. Ingresar el importe transferido en `Transferencia`.
3. El sistema descuenta ese importe del efectivo precargado y cambia el modo a `Mixto`.
4. Si queda una diferencia, se muestra como `Cuenta corriente`.
5. Cuando existe transferencia siguen siendo obligatorios el banco y el comprobante.

## Validacion tecnica

Ejecutar:

```powershell
node --check server.js
node --check app.js
node scripts\smoke-v99.js
```

El smoke verifica la cartera real sin aplicarla, el rechazo controlado de un archivo falso y la presencia del rebalanceo automatico de cobranza mixta.

## Produccion

Seguir `docs\PROCEDIMIENTO-CAMBIOS-PRODUCCION-GITHUB.md`: commit, push, backup de `data`, pull en Vultr, regeneracion de integridad, reinicio y controles de health, login, importador, reparto, licencia e integridad.
