# Ajuste modulo Stock administrador - 2026-06-17

## Estado de fase

Se mantiene la fase:

```text
Fase de modificacion / administracion de stock
```

No se avanza de fase porque se sigue estabilizando el sistema operativo principal.

## Requerimiento

El modulo Stock debe ser una herramienta de administracion, no solo una tabla:

- Ver stock primariamente en graficos.
- Buscar productos con desplegable.
- Exportar stock a CSV.
- Exportar stock a PDF.
- Mandar a imprimir para impresora conectada a red.
- Habilitar estas opciones solo para cuenta administradora.
- Permitir modificar un producto cargado, pero solicitando nuevamente clave de administrador.

## Cambios aplicados

Frontend `8790-13`:

- Panel superior de stock con KPIs.
- Grafico de estado del inventario: OK, Reponer, Sin stock.
- Grafico de reposicion prioritaria por diferencia contra minimo.
- Grafico de valor por rubro valorizado a costo.
- Buscador propio de stock con `datalist` de productos.
- Filtro por estado: todos, reponer, sin stock, OK.
- Tabla filtrada por buscador/filtro.
- Acciones admin:
  - Exportar CSV.
  - Exportar PDF.
  - Imprimir.
  - Modificar producto.
- Modal `Modificar producto` con reingreso obligatorio de clave admin.

Backend:

- Nuevo endpoint:

```text
POST /api/admin/reauth
```

- Valida que la sesion vigente sea admin.
- Valida nuevamente la clave del admin logueado.
- Rechaza vendedores o claves incorrectas.

## Seguridad operativa

La modificacion de producto queda protegida en dos capas:

1. Visual: botones ocultos para usuarios no administradores.
2. Servidor: `/api/admin/reauth` exige sesion admin y clave correcta antes de guardar.

Cada modificacion agrega movimiento:

```text
type: Edicion
```

Y agrega actividad:

```text
Producto modificado con revalidacion admin
```

## Archivos modificados

- `index.html`
- `styles.css`
- `app.js`
- `server.js`
- `sw.js`

## Validacion pendiente

- Probar impresion con la impresora real de red.
- Probar exportacion CSV/PDF desde la cuenta administradora.
- Probar modificacion de producto con clave correcta e incorrecta.
- Definir mas adelante un historial/auditoria mas formal por producto.
