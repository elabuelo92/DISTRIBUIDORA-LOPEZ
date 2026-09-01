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
