# Comisiones diferenciadas - v67

## Objetivo

La version v67 incorpora comisiones configurables por rol, usuario, rubro, producto y vigencia.

Las reglas iniciales quedan cargadas como configuracion editable desde Administracion:

- Vendedores:
  - Cigarrillos: 1 %
  - Resto de mercaderia: 3 %
- Repartidores:
  - Cigarrillos: 1 %
  - Resto de mercaderia: 4 %

## Prioridad de reglas

El motor aplica una sola regla por linea de producto, en este orden:

1. Usuario + producto.
2. Usuario + rubro.
3. Rol + producto.
4. Rol + rubro.
5. Regla general predeterminada.

## Base de calculo

La comision se calcula sobre el importe neto vendido y no anulado.

Si un pedido tiene cigarrillos y otros productos, el sistema calcula cada linea por separado y consolida:

- Comision por cigarrillos.
- Comision por resto de mercaderia.
- Comision total.

Si hay devolucion, se descuenta proporcionalmente. Si se cancela o rechaza un pedido, la comision queda en cero.

## Momento de devengamiento

- Vendedor: al confirmar el pedido.
- Repartidor: al entregar correctamente el pedido.

Esta regla evita duplicaciones entre preventa y reparto.

## Administracion

Nueva solapa:

`Comisiones`

Permite:

- Ver reglas activas e inactivas.
- Crear reglas nuevas.
- Editar reglas existentes.
- Inactivar reglas.
- Exportar resumen CSV.
- Ver auditoria de cambios.

Todo cambio exige motivo y queda auditado con usuario, fecha, hora, regla anterior y regla nueva.

## No retroactividad

Los pedidos ya confirmados conservan la comision calculada al momento de la operacion.

Los cambios de porcentaje impactan en operaciones futuras, salvo que Administracion registre un ajuste manual posterior.

## Validacion v67

Pruebas realizadas:

- `node --check` sobre `order-engine.js`, `delivery-engine.js`, `server.js` y `app.js`.
- Pedido mixto de prueba:
  - Cigarrillos aplico 1 %.
  - Resto de mercaderia aplico 3 % para vendedor.
  - Reparto aplico 1 % y 4 % al entregar.
  - La devolucion redujo la base proporcionalmente.
- Endpoint temporal:
  - `/api/health` respondio `runtimeVersion = 8790-67`.
  - Login admin correcto.
  - Alta de regla de comision correcta con auditoria.
