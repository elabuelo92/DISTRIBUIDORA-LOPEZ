# Ajuste tablero pipeline y alertas criticas - 2026-06-17

## Estado de fase

Se mantiene la fase:

```text
Fase de modificacion / tablero operativo
```

## Requerimiento

- En el tablero general mostrar de forma grafica cuantos pedidos estan:
  - Ingresados.
  - En armado.
  - En despacho.
  - En reparto.
  - Entregados.
- Reducir las alertas operativas del costado derecho.
- Mostrar solo las primeras 4 alertas de maxima urgencia.

## Cambios aplicados

Frontend `8790-16`:

- El bloque `Flujo del dia` ahora muestra un pipeline grafico de pedidos.
- Se agrego resumen general:

```text
Pedidos activos / pedidos totales / porcentaje entregado
```

- Cada etapa muestra:

```text
Cantidad
Descripcion
Barra proporcional
```

- Las alertas operativas ahora se ordenan por gravedad.
- El listado queda limitado a 4 alertas.
- Se incluyen como alertas criticas:
  - Pedidos urgentes o demorados.
  - Clientes excedidos de limite.
  - Productos sin stock o bajo minimo.
  - Alertas financieras pendientes.

## Archivos modificados

- `index.html`
- `styles.css`
- `app.js`
- `sw.js`

## Validacion realizada

- `node --check app.js` OK.
- `node --check server.js` OK.
- Version de assets subida a `8790-16`.

## Pendiente

- Validar visualmente con datos reales durante la operatoria diaria.
- Ajustar pesos de urgencia si administracion prefiere priorizar stock, pedidos o cuentas corrientes.
