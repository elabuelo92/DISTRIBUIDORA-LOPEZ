# Diagnostico del video y optimizacion del flujo de Armado - v114

Fecha: 27/08/2026

## Video analizado

Archivo: `WhatsApp Video 2026-08-26 at 18.26.18.mp4`

Duracion: 1 minuto 13 segundos.

Secuencia observada, con tiempos aproximados:

- 00:16: confirmacion de la operacion masiva.
- 00:18 a 00:24: pedido en `En Preparacion` con la interfaz en `Procesando...`.
- 00:28: pedido en `En Armado`.
- 00:36 a 00:38: pedido en `Etiquetado`.
- 00:40 a 00:44: pedido en `Listo para Despacho`.

La explicacion dada al cliente es correcta: los estados intermedios son obligatorios y no deben eliminarse. La demora entre estados no forma parte de la trazabilidad y si debe corregirse.

## Causa tecnica

La operacion anterior recorria cada pedido y ejecutaba una llamada HTTP independiente por cada etapa. Cada llamada escribia el archivo de estado completo y devolvia nuevamente toda la base al navegador.

Con varios pedidos, el costo crecia aproximadamente como:

`cantidad de pedidos x cantidad de etapas x lectura/escritura/sincronizacion completa`

Ademas, la accion masiva `Listo para Despacho` generaba una etiqueta y enviaba internamente el codigo esperado al scanner. Esto permitia simular el escaneo sin la pistola fisica y debilitaba la trazabilidad.

## Correccion v114

- Se agrego `POST /api/orders/bulk-workflow`.
- Un lote usa una sola peticion y una sola escritura atomica del estado.
- La respuesta devuelve solamente los pedidos modificados, no toda la base.
- Cada pedido conserva su auditoria individual, usuario, fecha, hora, valor anterior y nuevo.
- `Pendiente -> En Preparacion` y `En Preparacion -> En Armado` siguen siendo etapas independientes.
- La etiqueta solo se genera desde `En Armado`.
- `Listo para Despacho` solo se verifica; no genera ni simula el escaneo.
- El escaneo fisico sigue siendo obligatorio para pasar de `Etiquetado` a `Listo para Despacho`.
- El despacho continua dependiendo de hoja de ruta/publicacion y del control de stock existente.
- Las operaciones individuales de avanzar, etiquetar, escanear, priorizar y cancelar tambien usan respuestas compactas.

## Flujo operativo definitivo

1. Pendiente.
2. En Preparacion.
3. En Armado.
4. Generar e imprimir etiqueta.
5. Escanear fisicamente la etiqueta o cada bulto.
6. Listo para Despacho.
7. Asignar y publicar hoja de ruta.
8. Despachado.

No existe un comando directo que salte desde Armado hasta Despachado.

## Prueba automatizada

Script: `scripts/smoke-order-workflow-v114.js`

La prueba levanta un servidor temporal con un estado mayor a 2 MB y verifica:

- procesamiento masivo compacto;
- bloqueo antes de generar etiqueta;
- bloqueo antes del escaneo fisico;
- escaneo valido;
- rechazo del despacho directo;
- persistencia de trazabilidad de etiqueta y scanner;
- estado final `Listo para Despacho`.

Resultado local medido:

- Estado completo: mas de 2 MB.
- Respuesta para Armado: aproximadamente 3 KB.
- Respuesta para Etiquetado: aproximadamente 3,6 KB.
- Respuesta para Scanner: aproximadamente 4,5 KB.
- Tiempo de cada operacion: aproximadamente 40 a 55 ms en el servidor temporal.

Los tiempos de red reales dependen del servidor y de la conexion del cliente, pero la cantidad de datos y llamadas queda reducida de forma estructural.
