# Prompt 102 - Alta de clientes idempotente

Fecha: 25/08/2026
Version: 8790-109

## Causa raiz

La aplicacion esperaba como maximo 12 segundos la respuesta de `POST /api/clients/mobile`.
El servidor confirmaba la escritura del cliente antes de enviar la respuesta. Si la operacion de
persistencia o la red demoraban mas que ese limite, el navegador abortaba la espera y mostraba un
error aunque el cliente ya estuviera guardado.

El reintento no tenia una clave de idempotencia estable. Por eso una segunda pulsacion representaba
una operacion diferente y dependia solamente de la validacion por nombre para evitar duplicados.

## Correcciones

- El telefono genera un `operationId` unico y lo conserva mientras el resultado sea ambiguo.
- El servidor asocia el cliente a ese identificador y al usuario que realizo el alta.
- Repetir la misma operacion devuelve el cliente ya creado sin insertar nuevamente.
- Se agrego `GET /api/clients/mobile/status` para reconciliar respuestas perdidas.
- La escritura del alta utiliza archivo temporal y reemplazo atomico.
- La respuesta exitosa incluye `clientId` y el mensaje `Cliente creado correctamente`.
- El boton Guardar queda deshabilitado durante todo el proceso.
- Los errores HTTP conservan y muestran el motivo enviado por el servidor.
- Se mantiene compatibilidad con versiones anteriores mediante el codigo de cliente legado.

## Prueba automatizada

Comando:

```powershell
npm.cmd run test:client-create
```

La prueba utiliza una copia temporal de los datos y valida:

- diez altas consecutivas;
- diez identificadores diferentes;
- cero duplicados;
- diez respuestas confirmadas;
- reenvio de una operacion ya confirmada;
- recuperacion de una respuesta deliberadamente perdida;
- ausencia de archivos temporales luego del commit atomico.

Resultados del cierre:

| Corrida | Creados | Duplicados | Confirmaciones | Promedio API | Maximo API |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1 | 10 | 0 | 10 | 370 ms | 598.2 ms |
| 2 | 10 | 0 | 10 | 359 ms | 426.8 ms |

## Validacion de campo pendiente

La prueba automatizada cubre el contrato APP-API-persistencia-respuesta. La aceptacion definitiva se
completa con diez altas reales desde Android, usando cobertura movil y Wi-Fi, comprobando que el
cliente quede disponible inmediatamente para iniciar un pedido.
