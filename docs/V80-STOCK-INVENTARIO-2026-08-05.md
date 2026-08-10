# V80 - Stock e Inventario

Fecha: 2026-08-05  
Sistema: SERVIDOR_UNICO_8790  
Version: 8790-80

## Objetivo

Cerrar los prompts 74, 75 y 76:

- auditar y habilitar el modulo Stock;
- agregar carga inicial controlada de inventario;
- crear Libro de Movimientos de Stock.

## Auditoria funcional

### Funcionalidades existentes verificadas

- Existe menu de acceso a Stock.
- Existe pantalla de Control fisico.
- El usuario administrador puede ver Stock, Control fisico y acciones administrativas.
- La cartera actual esta cargada en el estado del sistema.
- El motor diferencia:
  - stock disponible para vender;
  - stock fisico;
  - stock reservado / comprometido;
  - stock en transito.
- Preventa reserva stock disponible al confirmar pedidos.
- El stock fisico baja cuando el pedido pasa a Despachado.
- Remitos de proveedor quedan pendientes hasta validacion administrativa.
- La validacion administrativa del remito impacta stock mediante movimiento de ingreso.

### Correcciones realizadas

- Se renombro el modulo principal a `Stock e Inventario`.
- Se agrego acceso visible a `Control fisico`.
- Se reorganizo la tabla principal de stock con:
  - Producto.
  - Codigo.
  - Rubro.
  - Stock disponible.
  - Stock comprometido.
  - Stock fisico esperado.
  - En preparacion.
  - Armado.
  - Pendiente de despacho.
  - Ultima actualizacion.
- Se agrego boton `Ver movimientos` por producto.
- Se agrego panel `Libro de movimientos de stock`.
- Se agregaron filtros por:
  - texto libre;
  - tipo de movimiento;
  - usuario;
  - fecha.
- Se agrego carga inicial de inventario con vista previa.
- Se agrego endpoint backend `/api/stock/initial-inventory`.
- La carga inicial genera backup previo.
- La carga inicial registra movimiento `Inventario inicial` por producto.
- La carga inicial registra auditoria global y notificacion administrativa.
- Se enriquecieron movimientos de reserva, ingreso y despacho con producto, cantidad, stock anterior, stock posterior, pedido, proveedor, cliente y usuario.

## Carga inicial de inventario

Ruta:

`Stock e Inventario -> Cargar inventario inicial`

Formato esperado:

```csv
codigo_producto;codigo_barras;descripcion;cantidad_fisica;deposito;observacion
DL-0001;;Album Mundial;120;Deposito;Conteo inicial
```

Tambien se puede pegar contenido desde Excel respetando esas columnas.

Validaciones:

- producto inexistente;
- codigo duplicado dentro del archivo;
- cantidad vacia o invalida;
- cantidad fisica menor que stock reservado;
- bloqueo de importacion parcial silenciosa.

Para aplicar:

1. Cargar archivo CSV o pegar desde Excel.
2. Presionar `Vista previa`.
3. Corregir filas marcadas en rojo, si existen.
4. Escribir `CONFIRMAR`.
5. Presionar `Aplicar inventario inicial`.

El sistema crea backup antes de modificar stock.

## Libro de movimientos

Tipos cubiertos:

- Inventario inicial.
- Ingreso.
- Ingreso desde transito.
- Mercaderia en transito.
- Reserva.
- Reserva parcial.
- Despacho.
- Ajuste fisico.
- Ajuste negativo.
- Remito validado.

Cada movimiento nuevo registra:

- producto;
- cantidad;
- tipo;
- stock anterior;
- stock posterior;
- pedido o remito asociado;
- cliente o proveedor;
- usuario;
- fecha;
- hora;
- motivo.

## Datos que faltan cargar en puesta en marcha

- Inventario fisico definitivo de deposito.
- Deposito por producto, si se usara mas de uno.
- Observaciones de conteo por rubro o sector.
- Validacion administrativa de remitos pendientes reales.

## Pruebas realizadas

- `node --check app.js`
- `node --check server.js`
- `node --check order-engine.js`
- Servidor temporal en puerto 8791 con `/api/health` OK.
- Login admin temporal OK.
- Preview del endpoint `/api/stock/initial-inventory` OK con producto real y sin modificar stock.

## Recomendacion operativa

Antes de trabajar en produccion, ejecutar un corte fisico real, cargarlo desde `Cargar inventario inicial` y guardar el backup generado. A partir de ese momento, todo ingreso, reserva, despacho y ajuste quedara trazado en el libro de movimientos.
