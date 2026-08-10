# Optimizacion de Performance v63

Fecha: 2026-07-21

## Problema detectado

El sistema estaba respondiendo lento porque cada sincronizacion descargaba el estado completo del sistema aunque no hubiera cambios. El archivo operativo `data/demo-state.json` supera los 6 MB, por lo que cada clic o refresco podia terminar disparando parseos y repintados costosos.

## Correcciones aplicadas

- Sincronizacion incremental: si el cliente ya tiene la ultima version, `/api/state` responde `unchanged: true` sin enviar el estado completo.
- Compresion gzip para respuestas JSON grandes.
- Cache en memoria del estado del servidor para evitar leer y parsear `demo-state.json` en cada request.
- Renderizado del panel activo: la interfaz ya no repinta todas las solapas ante cada actualizacion.
- Se evitan sincronizaciones superpuestas entre lectura y escritura.
- `/api/health` ya no devuelve el listado completo de productos por defecto.

## Mediciones

Antes de optimizar:

- `/api/state` completo: aproximadamente 6 MB.
- Tiempo observado: hasta 9,3 segundos.
- Sincronizacion repetida: enviaba nuevamente el estado completo.

Despues de optimizar:

- `/api/state` completo comprimido: 262 KB.
- Tiempo observado: 266 ms.
- `/api/state` sin cambios: 0,8 KB y 55 ms.
- `/api/health`: 0,6 KB y entre 92 ms y 170 ms luego del primer calentamiento.

## Resultado operativo

La primera carga del sistema debe sentirse mucho mas rapida y las sincronizaciones posteriores no deberian congelar la pantalla. En celulares conectados por Tailscale la mejora principal es que ya no viajan 6 MB cada pocos segundos.

## Siguiente mejora recomendada

Para crecer con muchos pedidos, clientes o comprobantes, el siguiente paso es separar el estado operativo en endpoints paginados por modulo:

- pedidos
- clientes
- stock
- reparto
- cuentas corrientes
- auditoria
- comprobantes

Eso permitiria cargar solo la solapa que el usuario esta usando.
