# Version 8790-99 - Importador y cobranza mixta

Fecha: 18/08/2026

## Alcance

- El importador valida que el archivo sea un XLSX real antes de enviarlo a ExcelJS.
- Los fallos internos de lectura se convierten en mensajes operativos claros.
- La aplicacion rechaza extensiones distintas de `.xlsx` antes de subir el archivo.
- En Reparto, al ingresar una transferencia sobre el total precargado en efectivo, el sistema redistribuye automaticamente el efectivo restante y cambia el modo a `Mixto`.
- El mismo comportamiento se aplica en sentido inverso cuando el total estaba precargado como transferencia.
- El alta movil de clientes devuelve una respuesta compacta en lugar del estado completo de produccion.
- El cliente nuevo se incorpora inmediatamente al padron local de Preventa y se sincroniza en segundo plano.

## Correccion de alta movil

El mensaje `signal is aborted without reason` era un falso error provocado por el timeout del navegador: despues de guardar el cliente, el servidor enviaba nuevamente todo el estado productivo, de aproximadamente 29 MB. En redes moviles la respuesta podia superar los 12 segundos y ser cancelada aunque el alta ya estuviera confirmada.

La respuesta de `POST /api/clients/mobile` contiene ahora solamente:

- resultado de la operacion;
- version del estado;
- cliente creado.

La prueba automatizada confirma que no se incluye el estado completo y que el cliente queda disponible para venta inmediata.

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

## Aplicacion productiva 18/08/2026

La cartera se aplico en produccion con autorizacion administrativa:

- 278 productos homologados y actualizados.
- 32 productos creados como altas nuevas.
- 377 productos de la cartera anterior inactivados.
- 310 productos activos finales sobre 687 registros historicos.
- 281 productos activos con stock mayor a cero.
- stock activo total cargado: 67.600 unidades.
- cero filas pendientes de homologacion.

Cobertura de precios recibida desde el Excel:

- Lista 1: 310 productos.
- Lista 2: 310 productos.
- Lista 3: 308 productos; dos celdas sin precio en el archivo fuente.
- Lista 4: 310 productos.
- Lista 5: 92 productos; 218 celdas sin precio en el archivo fuente.

No se inventaron precios para las celdas vacias. Kevin conserva la asignacion bloqueada a Lista 4.

Backups:

- `/opt/distribuidora-lopez/backups/data-pre-v99-20260818-230600.tar.gz`
- `/opt/distribuidora-lopez/data/backups/2026-08-18T23-52-50-319Z-importar-cartera-homologada`

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
