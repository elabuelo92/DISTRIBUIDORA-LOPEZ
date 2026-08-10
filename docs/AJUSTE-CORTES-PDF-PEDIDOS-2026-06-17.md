# Ajuste cortes PDF por estado de pedido - 2026-06-17

## Estado de fase

Se mantiene la fase:

```text
Fase de modificacion / tablero operativo
```

## Requerimiento

- Corregir los numeros descentrados en las tarjetas del pipeline de pedidos.
- Cada cuadro de estado debe permitir emitir un PDF con los pedidos correspondientes a ese estado.
- Ejemplo: tocar `Reparto` debe generar un corte de pedidos en reparto.

## Cambios aplicados

Frontend `8790-17`:

- Se corrigio el layout de los contadores de cada etapa.
- El numero queda centrado dentro de una caja fija.
- Cada tarjeta del pipeline queda clickeable.
- Tambien se puede activar con teclado usando `Enter` o `Espacio`.
- Se reutiliza el generador PDF interno del sistema.

## Cortes disponibles

- `Ingresados`: pedidos con estado `Recibido`.
- `Armado`: pedidos con estado `En armado`.
- `Despacho`: pedidos con estado `Listo reparto`.
- `Reparto`: pedidos con estado `En reparto`.
- `Entregado`: pedidos con estado `Entregado` o `Facturado`.

## Contenido del PDF

Cada corte incluye:

- Fecha de emision.
- Estado incluido.
- Cantidad de pedidos.
- Importe total.
- Codigo de pedido.
- Cliente.
- Vendedor.
- Importe.
- Estado.
- Demora.
- Prioridad.
- Detalle de productos.

## Archivos modificados

- `app.js`
- `styles.css`
- `index.html`
- `sw.js`

## Validacion realizada

- `node --check app.js` OK.
- `node --check server.js` OK.
- Version de assets subida a `8790-17`.

## Uso

1. Entrar con usuario administrador.
2. Abrir `Tablero general`.
3. Tocar una tarjeta del pipeline.
4. El navegador descarga el PDF del corte correspondiente.
