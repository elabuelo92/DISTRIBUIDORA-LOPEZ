# Distribuidora Lopez - v56 Etiquetas y Reparto

Fecha: 2026-07-20

## Prompt 46 - Etiquetas inteligentes

- Las etiquetas de armado se generan por cantidad de bultos confirmada.
- Cada bulto imprime una etiqueta independiente con cliente, direccion, telefono, pedido, ruta, codigo de barras e identificador unico.
- Ejemplo de codigos: `PED-2076-B01`, `PED-2076-B02`, `PED-2076-B03`.
- El escaneo puede validar cada bulto individualmente.
- El pedido pasa a `Listo para Despacho` cuando todos los bultos fueron escaneados.
- Por compatibilidad, escanear el codigo general del pedido valida todos los bultos.

## Prompt 47 - Reparto

- El modulo Reparto muestra inicialmente rutas publicadas.
- El repartidor debe usar `Tomar Ruta` para asociar la ruta al telefono corporativo.
- Las filas de paradas fueron compactadas para ver mas pedidos en pantalla.
- Administracion puede modificar la secuencia escribiendo el numero de orden.
- Con `TAB` o `ENTER` se guarda la nueva secuencia y se pasa al siguiente pedido.
- Los pedidos entregados se ocultan automaticamente de la lista operativa.
- `Rechazado` queda integrado dentro del flujo de `No entregado`.
- `Rendir caja` solo se habilita cuando todos los pedidos de la ruta fueron gestionados.

## Pruebas sugeridas

1. Pasar un pedido a `En Armado`.
2. Generar etiqueta con 3 bultos.
3. Verificar que se impriman 3 etiquetas, una por bulto.
4. Escanear `PED-XXXX-B01` y confirmar que aun no queda listo.
5. Escanear todos los bultos y confirmar `Listo para Despacho`.
6. Planificar ruta, publicarla y tomarla desde usuario repartidor.
7. Modificar secuencia desde Administracion con TAB o ENTER.
8. Gestionar todos los pedidos y verificar que recien ahi aparece `Rendir caja`.
