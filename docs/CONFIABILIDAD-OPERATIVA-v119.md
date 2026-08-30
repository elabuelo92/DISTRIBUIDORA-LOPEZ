# Confiabilidad operativa v119

Fecha: 30/08/2026
Version: `8790-119`

## Alcance

- Alta de clientes de Preventa validada con PIN operativo aleatorio de cuatro digitos.
- Generacion o regeneracion del PIN desde `Usuarios`, con clave administrativa y visualizacion unica.
- Baja o inactivacion de proveedores sin el falso error `applyStateVisibility is not defined`.
- Actualizacion de costos por remito coherente con la validacion economica global.
- Vinculo producto-proveedor completado desde la trazabilidad de remitos cuando el producto no tenia proveedor.
- Simulacion masiva de precios ejecutada contra el servidor antes de confirmar.
- Homologacion conservadora de productos sin proveedor por una palabra distintiva exacta del proveedor; la vista previa muestra los afectados y la confirmacion guarda el vinculo.
- Margen sobre costo aplicado con redondeo y auditoria.
- Alta de pedidos de Preventa idempotente: un reintento conserva el mismo pedido.
- Respuesta compacta para pedidos moviles y consulta de reconciliacion ante timeout o perdida de conexion.
- Selectores de clientes y productos con seis resultados iniciales, buscador y expansion voluntaria.
- Tabla de precios con seis productos iniciales y boton para desplegar el resto.

## PIN de vendedores

Desde `Usuarios del sistema`, usar `Generar PIN` o `Regenerar PIN` en un vendedor. El sistema solicita la clave administrativa y muestra el PIN una sola vez.

Para la carga inicial masiva, con backup automatico de `users.json`:

```powershell
npm.cmd run generate:seller-pins
```

El comando imprime la relacion vendedor/PIN para entregarla por un canal seguro. No guarda los PIN en texto plano.

## Pedidos sin duplicados

Cada pedido movil recibe un `operationId`. Si se pierde la respuesta:

1. la app consulta `/api/orders/mobile/status`;
2. si el pedido existe, confirma el mismo codigo;
3. si se reenvia, `/api/orders` devuelve el pedido original con `idempotentReplay: true`;
4. nunca crea un segundo pedido para la misma operacion.

## Validacion

```powershell
npm.cmd run test:operational-reliability
npm.cmd run test:client-create
npm.cmd run test:suppliers-prices
npm.cmd run test:commercial-prices
```

La prueba v119 cubre PIN, alta de cliente, doble envio de pedido, margen por proveedor, costo por remito y baja de proveedor duplicado.

## Estado de despliegue

Implementado localmente y pendiente de despliegue productivo en la ventana posterior a las 18:00.
