# Ajuste buscadores moviles - 2026-06-16

## Problema detectado en video

El formulario de preventa movil abria el selector nativo de Android para clientes.

Con 756 clientes cargados, el selector quedaba como una pantalla oscura larga, sin buscador util dentro de la app y sin contexto del pedido. Esto hacia que la carga desde el celular fuera impractica.

El mismo riesgo aplicaba al selector de productos, porque hay 644 articulos cargados.

## Correccion aplicada

Version frontend:

```text
8790-8
```

Cambios:

- Se ocultaron los select nativos grandes de cliente y producto.
- Se agrego buscador propio para clientes dentro de Preventa.
- Se agrego buscador propio para productos dentro de Preventa.
- Cada buscador muestra hasta 60 resultados y pide seguir escribiendo si hay mas.
- El cliente puede buscarse por nombre, codigo, razon social, ruta, zona o vendedor.
- El producto puede buscarse por descripcion, codigo, codigo de barras, rubro, marca, familia o segmento.
- Al seleccionar un item se actualiza el pedido sin abrir el picker nativo del telefono.

## Archivos modificados

- `index.html`
- `app.js`
- `styles.css`
- `sw.js`

## Prueba sugerida

1. Abrir en el celular:

```text
http://desktop-c2c0q4v:8790/index.html#preventa
```

2. Limpiar cache o recargar fuerte si sigue apareciendo el selector viejo.
3. Tocar `Cliente cargado`.
4. Escribir parte del nombre del cliente.
5. Seleccionar el resultado.
6. Tocar `Producto`.
7. Buscar por nombre, codigo o rubro.
8. Agregar cantidad y enviar pedido.

## Nota

El video fue procesado por capturas de cuadro. No habia herramienta local de transcripcion de audio instalada en esta PC, pero el error visual del formulario quedo identificado.

