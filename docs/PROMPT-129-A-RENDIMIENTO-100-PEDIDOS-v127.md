# Prompt 129-A - Rendimiento para 100 pedidos v127

## Alcance

Primera optimizacion medible sobre Planificacion de Reparto. La prueba usa servidores y bases temporales con 10, 50, 100 y 200 pedidos. No modifica produccion.

## Causa encontrada

1. Planificar, reordenar y publicar una ruta respondian con el estado global completo.
2. Publicar avanzaba cada pedido por separado y cada avance repetia migracion y reconstruccion completa de faltantes.
3. El costo crecia aproximadamente de forma cuadratica y el navegador recibia entre 4 y 5 MB por operacion.

## Cambio

- Las operaciones de ruta siguen siendo atomicas y persisten una sola vez.
- La migracion se realiza una vez por lote.
- Faltantes se reconstruye una vez al finalizar el lote.
- Backend devuelve parches compactos de ruta y pedidos afectados.
- Frontend aplica esos parches sin recargar el estado global.

## Resultado con 100 pedidos

| Operacion | Antes | Despues | Mejora |
|---|---:|---:|---:|
| Planificar | 264,0 ms / 4.163.432 B | 220,9 ms / 164.274 B | 96,1% menos transferencia |
| Reordenar | 276,0 ms / 4.167.615 B | 200,3 ms / 164.273 B | 96,1% menos transferencia |
| Publicar | 10.634,2 ms / 4.348.780 B | 717,7 ms / 789.489 B | 14,8x mas rapido |

Con 200 pedidos, publicar bajo de 39.474,2 ms a 1.547,4 ms: 25,5x mas rapido.

## Evidencia

- `docs/performance-129A-before-v126.json`
- `docs/performance-129A-after-v127.json`
- `scripts/benchmark-100-orders-v127.js`

## Limites automaticos

Para 100 pedidos la prueba exige:

- respuestas compactas en planificar, reordenar y publicar;
- planificacion menor a 500 KB;
- publicacion menor a 1,5 MB;
- publicacion menor a 3 segundos en el entorno de prueba.

Comando:

```powershell
npm.cmd run test:performance-100
```
