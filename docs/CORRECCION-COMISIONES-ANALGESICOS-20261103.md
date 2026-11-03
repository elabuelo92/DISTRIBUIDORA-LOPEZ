# Correccion de identificacion de vendedores para comisiones

Fecha: 2026-11-03
Version objetivo: 8790-198

## Causa

La accion para aplicar el esquema buscaba los vendedores en el estado comercial del frontend, que puede omitir el nombre de usuario del padron administrativo. Por eso rechazaba como ambiguo a Kevin Guibert aunque existe un usuario vendedor unico y activo.

## Cambio

- Consultar el padron actualizado de usuarios administrativamente antes de preparar el lote.
- Resolver cada vendedor por usuario esperado y comprobar coincidencia exacta del nombre visible.
- Detenerse antes de escribir si falta un usuario, esta inactivo, duplicado o no coincide.
- Mantener la confirmacion de la accion y su lote de cuatro reglas de Analgesicos al 10% desde 01/11/2026. No se recalculan pedidos, liquidaciones ni ventas historicas; las reglas de cigarrillos y resto no se modifican.

## Verificacion local

- `node --check app.js`
- `node scripts/smoke-p4-commissions.js`
- `git diff --check`

La publicacion del frontend no modifica datos comerciales. La persistencia del lote de reglas debe verificarse por separado en Comisiones despues de publicar.
