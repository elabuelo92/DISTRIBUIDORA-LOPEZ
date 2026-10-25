# Stock e Inventario - tres accesos

Estado: **Implementado localmente, pendiente de despliegue**.
Fecha: 2026-10-24. Base productiva publicada en el turno anterior: 8790-189.
No hubo acceso, cambios, mantenimiento ni reinicio productivo en esta tarea.

## Cambios

- Tres accesos persistentes con los iconos existentes: Existencias, Control fisico y Abastecimiento.
- Seleccion activa visible, navegacion por teclado y respeto de los permisos existentes.
- Control fisico reutiliza su pantalla y sus controles, sin duplicar el modulo ni perder filtros.
- Resumen de stock y Movimientos siguen en el selector de herramientas de Existencias.
- Abastecimiento conserva filtros, indicadores, Excel, PDF e impresion. Se elimina su barra de navegacion redundante.
- No se abre ni calcula Abastecimiento desde la portada, Existencias o Control fisico.
- Una busqueda diferida de Stock solo renderiza la herramienta donde se inicio. La prueba detecto que, al cambiar rapidamente de seccion, el temporizador previo podia recalcular un informe distinto; se agrego la comprobacion de vista/herramienta, sin nuevos timers.
- Sin cambios en motor de stock, servidor, pedidos, reservas, movimientos, cantidades o saldos.

## Pruebas

- 13 controles de navegacion en navegador aislado: tres accesos, mismo modulo de conteo, teclado, filtros conservados, informes secundarios, permisos, un render por entrada, informe diferido, estado completo identico, sin POST de negocio, iconos/textos y otros modulos sin cambios.
- Escritorio 1440/768 px y movil 390/320 px, sin desborde de pagina ni nombres cortados; modo oscuro y capturas revisadas.
- Regresion P141: 18 controles, guardado local de metadatos, un ingreso ficticio, actualizacion, filtros, Excel numerico, PDF, impresion, sin popup ni solicitudes duplicadas. Cero errores JavaScript.
- Pruebas unitarias P141/P142 y `smoke-inventory-finance-workspaces.js` aprobadas: 14 ramas diferidas y equivalencia de calculos.
- Sintaxis de app y `git diff --check` aprobados.
- Una iteracion de la prueba visual intento pulsar el boton de tema de escritorio en ancho movil; se corrigio el selector de prueba al boton movil. No requirio cambiar la funcionalidad del ERP.

## Archivos y evidencia

- `app.js`, `styles.css`: interfaz y guardia de busqueda pendiente.
- `scripts/stock-navigation-browser-check.js`: pruebas de los tres accesos y capturas.
- `scripts/supply-manual-browser-check.js`: integra el recorrido nuevo y conserva las verificaciones existentes.
- `docs/STOCK-NAVEGACION-results.json`, `docs/P141-abastecimiento-results.json` y capturas `STOCK-NAVEGACION-*.png`.

Demo aislada: http://127.0.0.1:23822/#stock. Solo datos ficticios.
Proceso de preview: 20172. Usuario ficticio `admin1`, clave `LocalCountTest-Only!`.
El indicador de version de la demo conserva la base 8790-189; estos cambios visuales adicionales no estan publicados. Antes de publicar corresponde asignar nueva version/cache, respaldar y verificar integridad productiva.
