# Mitigacion de memoria en sincronizacion 8790-181

## Evidencia del incidente

- 21/10/2026 09:06:35 ART: Node finalizo con `Reached heap limit Allocation failed - JavaScript heap out of memory`.
- Reinicio automatico a las 09:06:58 ART; no iniciado por esta intervencion.
- Salud posterior: 9 sesiones, sin cola, HTTP 200 local en 122 ms, licencia e integridad correctas. Esto no descarta lentitud de otras operaciones.
- Copia de solo lectura: 90.112.718 bytes. Secciones principales: orders 40.876.658, stockMovements 10.898.449, deliveryRoutes 8.275.757, orderAudit 7.981.867 bytes.
- No se identifico la solicitud exacta que disparo el fallo. La memoria agotada es una causa confirmada de la caida; la serializacion simultanea es un factor reproducible de presion.

## Cambio acotado

- Construir respuestas de sincronizacion mediante buffers por seccion, evitando concatenar y aplanar otra cadena completa del estado.
- Mismos permisos, campos, hashes, datos y formato HTTP; sin migraciones, archivado ni eliminacion de informacion.
- Reducir DL_MAX_FULL_STATE_RESPONSES de 4 a 2 durante el despliegue. No aumentar el limite de RAM ni reiniciar otros servicios.

## Prueba local con copia de 90 MB

Cuatro respuestas de administrador con gzip, heap del proceso de prueba limitado a 768 MiB. Es una prueba de serializacion, no una prueba completa HTTP de jornada.

| Implementacion | Simultaneas | Pico RSS bytes | Pico heap bytes | Duracion lote ms |
| --- | --- | --- | --- | --- |
| Anterior | 4 | 1194790912 | 658290104 | 7462 |
| Anterior | 2 | 1037897728 | 658290112 | 8444 |
| Buffers por seccion | 4 | 843030528 | 216040832 | 6661 |
| Buffers por seccion | 2 | 685211648 | 216014344 | 8369 |

Respuesta SHA256 identica en los cuatro ensayos: c4aeeffc784ff114c2016c0a0db938ac38536df9ea3d4f9c17ab0a4353dac43c.
Copia fuente sin cambios. Mejora de RSS aproximada 43%; el lote con limite 2 puede tardar mas por la espera. No se promete menor latencia en cada solicitud.

## Pruebas de regresion

- 28/28 P1-P11 aprobadas fuera de la restriccion de sockets local. El primer intento restringido no logro conectar al servidor temporal y se interrumpio; no fue un fallo de produccion.
- smoke-state-sections: equivalencia byte a byte, Unicode, vacios, campos omitidos, sincronizacion parcial, eliminaciones y recuperacion de version.
- smoke-full-seller-catalog y smoke-cache-update-v126 aprobadas.

## Despliegue y validacion pendientes al preparar este documento

Usuario autoriza corte desde las 09:35 ART del 21/10. Respaldo de app/datos/configuracion; reiniciar solo ERP; comparar estado completo y usuarios con respaldo antes de salir de mantenimiento. Luego comprobar salud publica, version, limite 2 y registros.
La revision de crecimiento del historial y prueba de carga prolongada siguen pendientes. No confundir esta mitigacion con una solucion definitiva de toda la escalabilidad.
