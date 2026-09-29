# Herramientas de inventario y cuentas

Estado: implementado localmente, pendiente de despliegue. No se modifico produccion.

## Organizacion

- Precios: productos/listas, modificar/simular, carteras/vendedores, ofertas, listas/historial.
- Stock: inventario, resumen, abastecimiento, movimientos.
- Cuentas: cuentas/pagos y conciliacion bancaria.
- Control fisico: conteo/trazabilidad y cortes/ajustes.

Se reutiliza el cuadro de herramientas existente, con iconos, regreso al inicio y
selector de herramienta. Los controles se mueven, no se duplican: mantienen sus
eventos y valores. Las herramientas administrativas respetan el rol existente.
El acceso Ver movimientos abre directamente el libro de stock con el producto filtrado.

## Rendimiento

Las pantallas de inicio no calculan sus tablas ni graficos ocultos. Cada herramienta
ejecuta solo su lectura al abrirse. No se agregan peticiones, timers ni caches persistentes.

Stock y control fisico comparten un indice temporal de reservas por lectura, con
union por codigo/nombre sin duplicar coincidencias. Se conserva el orden de las trazas.
Control fisico y libro de stock dejan de calcular dos veces el mismo conjunto de filas.

El resumen de cuentas agrupa pedidos y movimientos por cliente una sola vez. Reutiliza
accountSummary sin cambiar las reglas de saldo, credito, deuda, ultimo pago o autorizacion.
La deduplicacion del archivo historico se realiza antes de agrupar por cliente.

## Pruebas locales

Comando: node scripts/smoke-inventory-finance-workspaces.js

| Calculo aislado | Antes ms | Despues ms | Muestra |
| --- | ---: | ---: | --- |
| Trazas de reservas | 1701.68 | 9.31 | 700 productos, 101 pedidos sinteticos |
| Resumen de cuentas | 2948.83 | 19.77 | 1302 clientes, 700 pedidos, 1801 movimientos |

Resultados identicos antes/despues y estado sin mutaciones. Se verifica que una
nueva lectura refleje cambios, sin cache obsoleta. Incluye coincidencias simultaneas
de codigo/nombre, pedidos archivados duplicados, nombres duplicados y saldo a favor.
Estos valores NO son tiempos HTTP ni tiempos completos de carga en produccion.

Tambien pasan:
- node scripts/smoke-consolidated-accounts-v133.js
- node scripts/smoke-suppliers-prices-v115.js
- node scripts/smoke-dashboard-lazy-render.js
- node --check app.js
- node --check account-engine.js
- git diff --check

Demo local 21890: recorridas las 13 herramientas sin escribir datos. Todos los paneles
contienen sus controles e iconos. Ver movimientos conserva el filtro de producto.
Las cuatro entradas comprobadas a 1440px y 390px; sin desborde horizontal de pagina
en las entradas moviles. Consola sin errores durante la validacion.
La demo conserva la version de backend 8790-157-tools-preview; esta prueba no valida
un despliegue ni una actualizacion del backend productivo.

## Antes de publicar

Requiere autorizacion, respaldo, nueva version de assets que incluya app.js,
account-engine.js y styles.css, regeneracion de integridad y validacion controlada.
No hay migraciones ni cambios de pedidos, precios, saldos o movimientos persistidos.
La congestion de sincronizaciones completas sigue siendo un problema separado;
esta mejora no constituye una garantia de capacidad concurrente en produccion.
