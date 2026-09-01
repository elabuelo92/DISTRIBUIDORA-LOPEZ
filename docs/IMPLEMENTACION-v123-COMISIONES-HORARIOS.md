# Implementacion v123: comisiones y horarios

## Comisiones

- El acumulado visible en Preventa usa mes calendario y permite consultar meses anteriores.
- La jornada diaria conserva clientes, pedidos, bruto y comision estimada de hoy.
- El cambio de mes es un filtro; no ejecuta DELETE, UPDATE, RESET ni TRUNCATE.
- Administracion conserva filtros por vendedor y rango.
- Las reglas historicas quedan visibles y no se borran.
- La precedencia sigue el orden: vendedor/producto, vendedor/categoria, vendedor general, producto/categoria general, regla general.

## Horarios de clientes

- Estructura por dia con hasta dos rangos horarios.
- Observacion de recepcion separada.
- Compatible con el texto historico `horario_atencion`.
- Visible en ficha de Preventa y factura/guia de armado.
- Los clientes existentes sin horario continúan operativos y muestran `No informado` al imprimir.

## Despliegue

La version de codigo es `8790-123`. Antes de produccion ejecutar backup, pruebas, integridad, reinicio controlado y validacion de `/api/health` conforme al procedimiento habitual.

# Criterio transversal de modificacion

- Una edicion deja un unico valor operativo vigente para la entidad y el alcance editados.
- El valor anterior se conserva solo en auditoria o historial; no queda activo ni compite con el nuevo.
- Una nueva alta duplicada se rechaza: no se interpreta silenciosamente como una edicion.
- En configuraciones con vigencia, la nueva version cierra las anteriores equivalentes sin recalcular operaciones historicas.
- Este criterio se verifico en usuarios, clientes, proveedores, listas de precios y reglas de comision. Cada modulo conserva su auditoria especifica.

## Reparacion controlada de una superposicion existente

Simular primero:

```bash
node scripts/repair-commission-conflict.js --state /opt/distribuidora-lopez/data/demo-state.json --winner COM-1788209458264-2578 --losers COM-SELLER-AXEL-RESTO
```

Aplicar solamente si la simulacion informa `conflicts: 0` y `ordersPreserved: true`:

```bash
node scripts/repair-commission-conflict.js --state /opt/distribuidora-lopez/data/demo-state.json --winner COM-1788209458264-2578 --losers COM-SELLER-AXEL-RESTO --actor Administracion --motive "La configuracion del 4 por ciento reemplaza la anterior del 5 por ciento." --apply
```

La herramienta crea un backup adicional del archivo de estado, escribe en forma atomica y no modifica pedidos ni sus comisiones historicas.
