# Prompt 89 - Rendimiento del modulo Clientes (v97)

Fecha: 15/08/2026

## Alcance

Correccion enfocada exclusivamente en la navegacion y carga inicial del modulo Clientes. No se refactorizaron Pedidos, Reparto, Stock, Proveedores, Estadisticas ni Cuentas.

## Diagnostico previo

- La base productiva medida contenia 802 clientes.
- El archivo de estado completo ocupaba 24.737.675 bytes y su parseo aislado demoro 263,6 ms.
- Al abrir Clientes no existia una consulta HTTP especifica: el navegador procesaba el estado completo ya descargado.
- `renderClients()` recorria y generaba las 802 filas en forma sincronica antes de que el navegador pudiera pintar el cambio de pantalla.
- Para cada fila se recalculaba la cuenta del cliente y se reconstruia la relacion completa cliente/proveedor. Ese trabajo repetido producia un costo similar a O(n2).
- La medicion automatizada de la interfaz v96 no logro visualizar `#clientes.active` dentro de 10.000 ms. La navegacion anterior queda registrada como mayor a 10 segundos.
- Requests especificos a Clientes antes del cambio: 0. La demora era computo y renderizado en el hilo principal.

## Causa raiz

Bloqueo del hilo principal por renderizado sincrono de todo el padron y por calculos repetidos de cuentas y entidades mixtas para cada cliente. No habia un endpoint SQL lento ni una consulta SQL involucrada: esta version utiliza un estado JSON cacheado en memoria.

## Correcciones aplicadas

1. La vista Clientes se activa y pinta antes de solicitar datos.
2. El loader se limita al cuerpo del listado; encabezado, filtros, menu y navegacion permanecen disponibles.
3. Se agrego `GET /api/clients` con paginacion real del lado servidor, limite predeterminado de 50 y maximo de 100.
4. El endpoint devuelve solo los campos resumidos necesarios para la grilla.
5. Los indices de relacion cliente/proveedor se construyen una sola vez por consulta.
6. Se incorporaron filtros de servidor por texto, estado, vendedor, zona y situacion de cuenta.
7. La busqueda utiliza debounce de 400 ms.
8. Se evita duplicar una peticion identica y se cancela una consulta anterior cuando cambian los filtros.
9. Se agrego timeout de 8 segundos, mensaje local de error y boton Reintentar.
10. Se agrego cache de las ultimas paginas durante 15 segundos con actualizacion silenciosa cuando corresponde.
11. No se precarga Clientes al iniciar sesion o renderizar otro modulo.
12. Se agregaron trazas temporales `Clientes.navigationStart`, `componentMounted`, `apiRequestStart`, `apiResponseReceived` y `renderComplete`.
13. Mientras Clientes esta activo, el polling general difiere la descarga del estado operativo completo y mantiene solamente version, sesion y presencia. La sincronizacion completa se reanuda al salir de la vista.

## Validacion automatizada local

Fixture: 125 clientes.

- Endpoint: 15 ms.
- Procesamiento de servidor: 2,9 ms.
- Primera pagina: 50 registros.
- Respuesta: 29.011 bytes.
- Total de paginas: 3.
- Proteccion contra requests duplicados: validada.
- Compatibilidad: smoke v95, v96 y v97 aprobados.

## SQL e indices

No aplica a la arquitectura actual del modulo. Los datos operativos residen en `demo-state.json` y el servidor conserva una copia parseada en memoria. No se agregaron indices SQL ficticios ni cambios de base de datos que no correspondan al sistema real.

## Medicion productiva posterior

Primera medicion v97 inmediatamente despues del login, antes de aislar el polling general:

- Vista Clientes visible: 490 ms.
- Primeras 50 filas: 5.216 ms.
- Requests especificos a `/api/clients`: 1.
- Procesamiento del endpoint: 5,2 ms.
- Espera de red observada: 3.418 ms.
- Causa de la espera restante: dos descargas generales de `/api/state` compitieron con el listado.

Medicion final controlada, separando la sincronizacion inicial de la navegacion:

- Version:
- Commit:
- Clientes productivos:
- Sincronizacion inicial:
- Tiempo hasta vista visible:
- Tiempo hasta primeras filas:
- Requests a `/api/clients`:
- Tiempo total del endpoint:
- Tiempo de procesamiento:
- Filas renderizadas:
- Estado de licencia e integridad:

## Herramientas de prueba

- `node scripts/smoke-v97.js`
- `node scripts/measure-clients-performance.js` con `DL_TEST_BASE_URL`, `DL_TEST_USER` y `DL_TEST_PASSWORD`.
